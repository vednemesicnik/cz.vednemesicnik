import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createIssueStore, type IssueStore } from '../data/issues.server.ts'
import type { Issue } from '../domain/issue.ts'
import { now } from '../domain/time.ts'
import { createTestApp, TEST_ISSUES_FOLDER } from '../test-app.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { createFakeDrive, type FakeDrive } from './fake-drive.server.ts'
import { createDriveFolders } from './folders.server.ts'
import { checkIssueFolders, type IssueFoldersDeps } from './issue-folders.server.ts'
import { createIssue } from './issue-setup.server.ts'

const TOKEN: DriveAccessToken = { accessToken: 'test-access-token', expiresAt: now(), ok: true }
const FIRST = Temporal.Instant.from('2026-11-20T08:12:00Z')
const LATER = Temporal.Instant.from('2026-11-20T10:30:00Z')

type Harness = {
  check(at?: Temporal.Instant): ReturnType<typeof checkIssueFolders>
  deps: IssueFoldersDeps
  drive: FakeDrive
  issue: Issue
  stored(): Promise<Issue>
  store: IssueStore
}

async function withIssue(run: (harness: Harness) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    let drive = createFakeDrive()
    let store = createIssueStore(app.database)
    let folders = createDriveFolders({ accessToken: 'test-access-token', fetch: drive.fetch })
    let created = await createIssue(
      {
        folders: () => folders,
        issuesFolderId: TEST_ISSUES_FOLDER,
        now,
        store,
        token: async () => TOKEN,
      },
      'VDM_2026_5',
      { displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' },
    )
    if (created.kind !== 'created') throw new Error('No issue.')
    let issue = created.issue
    let deps: IssueFoldersDeps = { folders, issues: store, now: () => FIRST }
    await run({
      check: (at = FIRST) => checkIssueFolders({ ...deps, now: () => at }, issue),
      deps,
      drive,
      issue,
      async stored() {
        let found = await store.findById(issue.id)
        if (found === null) throw new Error('The issue went.')
        return found
      },
      store,
    })
  } finally {
    await app.close()
  }
}

function idsOf(issue: Issue): { articles: string; issue: string } {
  let { articles, issue: folder } = issue.folderIds
  if (articles === null || folder === null) throw new Error('No folders.')
  return { articles, issue: folder }
}

describe('the issue’s own folders (12j)', () => {
  it('marks nothing while Články is there', () =>
    withIssue(async ({ check, stored }) => {
      assert.deepEqual(await check(), { missing: [] })
      assert.deepEqual((await stored()).missing, { articles: null, issue: null })
    }))

  it('marks Články in the bin on its own, keeping the first time while it stays there', () =>
    withIssue(async ({ check, drive, issue, stored }) => {
      drive.trash(idsOf(issue).articles)

      assert.deepEqual(await check(), { missing: ['articles'] })
      assert.deepEqual(await check(LATER), { missing: ['articles'] })
      assert.deepEqual((await stored()).missing, { articles: FIRST, issue: null })
    }))

  it('marks only the issue folder when Články is in the bin with it', () =>
    withIssue(async ({ check, drive, issue, stored }) => {
      drive.trash(idsOf(issue).issue)

      assert.deepEqual(await check(), { missing: ['issue'] })
      assert.deepEqual((await stored()).missing, { articles: null, issue: FIRST })
    }))

  it('marks both when each went to the bin on its own, and clears what came back', () =>
    withIssue(async ({ check, drive, issue, stored }) => {
      let ids = idsOf(issue)
      drive.trash(ids.articles)
      drive.trash(ids.issue)
      assert.deepEqual(await check(), { missing: ['issue', 'articles'] })

      drive.restore(ids.issue)
      assert.deepEqual(await check(LATER), { missing: ['articles'] })
      assert.deepEqual((await stored()).missing, { articles: FIRST, issue: null })

      drive.restore(ids.articles)
      assert.deepEqual(await check(), { missing: [] })
      assert.deepEqual((await stored()).missing, { articles: null, issue: null })
    }))

  it('records nothing when Drive does not answer', () =>
    withIssue(async ({ deps, issue, stored, store }) => {
      await store.markMissing(issue.id, ['articles'], FIRST)
      let silent: IssueFoldersDeps = { ...deps, folders: { standing: async () => 'unavailable' } }

      assert.equal(await checkIssueFolders(silent, issue), 'unavailable')
      assert.deepEqual((await stored()).missing, { articles: FIRST, issue: null })
    }))
})
