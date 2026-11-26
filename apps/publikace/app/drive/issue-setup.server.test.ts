import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createIssueStore } from '../data/issues.server.ts'
import { now } from '../domain/time.ts'
import { createTestApp, TEST_ISSUES_FOLDER, type TestApp } from '../test-app.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { createFakeDrive, type FakeDrive } from './fake-drive.server.ts'
import { createDriveFolders } from './folders.server.ts'
import { createIssue, finishIssue, type IssueSetup } from './issue-setup.server.ts'

const MARIE = { displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' }
const TOKEN: DriveAccessToken = { accessToken: 'test-access-token', expiresAt: now(), ok: true }

function setupOn(app: TestApp, drive: FakeDrive, token = TOKEN): IssueSetup {
  return {
    folders: (accessToken) => createDriveFolders({ accessToken, fetch: drive.fetch }),
    issuesFolderId: TEST_ISSUES_FOLDER,
    now,
    store: createIssueStore(app.database),
    token: async () => token,
  }
}

async function withApp(run: (app: TestApp, drive: FakeDrive) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await run(app, createFakeDrive())
  } finally {
    await app.close()
  }
}

describe('creating an issue (11d)', () => {
  it('creates the issue folder and both folders inside it, and completes the issue', () =>
    withApp(async (app, drive) => {
      let outcome = await createIssue(setupOn(app, drive), 'VDM_2026_6', MARIE)

      assert.equal(outcome.kind, 'created')
      if (outcome.kind !== 'created') return
      let [issueFolder, articles, print] = drive.folders()
      assert.deepEqual(
        drive.folders().map((folder) => [folder.name, folder.parentId]),
        [
          ['VDM_2026_6', TEST_ISSUES_FOLDER],
          ['Články', issueFolder?.id],
          ['_Podklady_pro_tisk', issueFolder?.id],
        ],
      )
      assert.deepEqual(outcome.issue.folderIds, {
        articles: articles?.id,
        issue: issueFolder?.id,
        print: print?.id,
      })
      assert.ok(outcome.issue.completedAt !== null)
      assert.equal(outcome.issue.startedByName, 'Marie Horáková')
    }))

  it('touches neither the database nor Drive while the account is not connected (14g)', () =>
    withApp(async (app, drive) => {
      let setup = setupOn(app, drive, { ok: false, reason: 'not-connected' })
      let outcome = await createIssue(setup, 'VDM_2026_6', MARIE)

      assert.deepEqual(outcome, { kind: 'not-connected' })
      assert.deepEqual(drive.calls, [])
      assert.deepEqual(await setup.store.list(), [])
    }))

  it('writes nothing while the account is disconnected or Google does not answer', () =>
    withApp(async (app, drive) => {
      for (let reason of ['disconnected', 'unavailable'] as const) {
        let setup = setupOn(app, drive, { ok: false, reason })
        assert.deepEqual(await createIssue(setup, 'VDM_2026_6', MARIE), { kind: reason })
        assert.deepEqual(await setup.store.list(), [])
      }
    }))

  it('writes nothing and asks nothing without the issues folder', () =>
    withApp(async (app, drive) => {
      let setup = { ...setupOn(app, drive), issuesFolderId: '' }
      let asked = 0
      setup.token = async () => {
        asked++
        return TOKEN
      }

      assert.deepEqual(await createIssue(setup, 'VDM_2026_6', MARIE), { kind: 'unavailable' })
      assert.equal(asked, 0)
      assert.deepEqual(await setup.store.list(), [])
    }))

  it('refuses a name already in the app before Drive is asked', () =>
    withApp(async (app, drive) => {
      let setup = setupOn(app, drive)
      await createIssue(setup, 'VDM_2026_5', MARIE)
      let calls = drive.calls.length

      let outcome = await createIssue(setup, ' vdm_2026_5', MARIE)
      assert.deepEqual(outcome, { existingName: 'VDM_2026_5', kind: 'duplicate' })
      assert.equal(drive.calls.length, calls)
    }))

  it('removes the row when Drive fails at the issue folder, so the name is free (1jv85zum)', () =>
    withApp(async (app, drive) => {
      let setup = setupOn(app, drive)
      drive.failCreate('VDM_2026_6')

      assert.deepEqual(await createIssue(setup, 'VDM_2026_6', MARIE), { kind: 'unavailable' })
      assert.deepEqual(await setup.store.list(), [])

      drive.heal()
      assert.equal((await createIssue(setup, 'VDM_2026_6', MARIE)).kind, 'created')
    }))

  it('leaves the issue unfinished, with what it has, when Drive fails after the issue folder', () =>
    withApp(async (app, drive) => {
      drive.failCreate('_Podklady_pro_tisk')
      let outcome = await createIssue(setupOn(app, drive), 'VDM_2026_6', MARIE)

      assert.equal(outcome.kind, 'unfinished')
      if (outcome.kind !== 'unfinished') return
      assert.equal(outcome.issue.completedAt, null)
      assert.ok(outcome.issue.folderIds.issue !== null)
      assert.ok(outcome.issue.folderIds.articles !== null)
      assert.equal(outcome.issue.folderIds.print, null)
    }))
})

describe('finishing an issue (12i)', () => {
  async function unfinished(app: TestApp, drive: FakeDrive, failing: string) {
    let setup = setupOn(app, drive)
    drive.failCreate(failing)
    let outcome = await createIssue(setup, 'VDM_2026_6', MARIE)
    drive.heal()
    if (outcome.kind !== 'unfinished') throw new Error(`expected unfinished, got ${outcome.kind}`)
    return { issue: outcome.issue, setup }
  }

  it('adds only what is missing', () =>
    withApp(async (app, drive) => {
      let { issue, setup } = await unfinished(app, drive, 'Články')
      let before = drive.folders().length

      let outcome = await finishIssue(setup, issue)
      assert.equal(outcome.kind, 'finished')
      if (outcome.kind !== 'finished') return
      assert.ok(outcome.issue.completedAt !== null)
      assert.deepEqual(
        drive
          .folders()
          .slice(before)
          .map((folder) => folder.name),
        ['Články', '_Podklady_pro_tisk'],
      )
    }))

  it('adopts a folder Drive created while its reply was lost', () =>
    withApp(async (app, drive) => {
      drive.loseReplyOnCreate('Články')
      let setup = setupOn(app, drive)
      let created = await createIssue(setup, 'VDM_2026_6', MARIE)
      if (created.kind !== 'unfinished') throw new Error('expected unfinished')

      let outcome = await finishIssue(setup, created.issue)
      assert.equal(outcome.kind, 'finished')
      let names = drive.folders().map((folder) => folder.name)
      assert.equal(names.filter((name) => name === 'Články').length, 1)
    }))

  it('creates nothing when the stored issue folder is gone', () =>
    withApp(async (app, drive) => {
      let { issue, setup } = await unfinished(app, drive, 'Články')
      drive.trash(issue.folderIds.issue ?? '')
      let before = drive.folders().length

      assert.deepEqual(await finishIssue(setup, issue), { kind: 'folder-gone' })
      assert.equal(drive.folders().length, before)

      drive.remove(issue.folderIds.issue ?? '')
      assert.deepEqual(await finishIssue(setup, issue), { kind: 'folder-gone' })
    }))

  it('stays unfinished when Drive does not answer', () =>
    withApp(async (app, drive) => {
      let { issue, setup } = await unfinished(app, drive, 'Články')
      drive.goDown()

      assert.deepEqual(await finishIssue(setup, issue), { kind: 'unavailable' })
      assert.equal((await setup.store.findByName('VDM_2026_6'))?.completedAt, null)
    }))

  it('creates the issue folder too when the process stopped before it', () =>
    withApp(async (app, drive) => {
      let setup = setupOn(app, drive)
      let inserted = await setup.store.insert({
        at: now(),
        name: 'VDM_2026_6',
        startedByEmail: MARIE.email,
        startedByName: MARIE.displayName,
      })
      if (!inserted.ok) throw new Error('not inserted')

      let outcome = await finishIssue(setup, inserted.issue)
      assert.equal(outcome.kind, 'finished')
      assert.deepEqual(
        drive.folders().map((folder) => folder.name),
        ['VDM_2026_6', 'Články', '_Podklady_pro_tisk'],
      )
    }))

  it('creates each folder once when two finishes run at the same time', () =>
    withApp(async (app, drive) => {
      let { issue, setup } = await unfinished(app, drive, 'Články')
      let before = drive.folders().length

      let outcomes = await Promise.all([finishIssue(setup, issue), finishIssue(setup, issue)])
      assert.deepEqual(
        outcomes.map((outcome) => outcome.kind),
        ['finished', 'finished'],
      )
      assert.deepEqual(
        drive
          .folders()
          .slice(before)
          .map((folder) => folder.name),
        ['Články', '_Podklady_pro_tisk'],
      )
    }))

  it('answers not-found for an issue whose row is gone', () =>
    withApp(async (app, drive) => {
      let { issue, setup } = await unfinished(app, drive, 'Články')
      await setup.store.remove(issue.id)
      assert.deepEqual(await finishIssue(setup, issue), { kind: 'not-found' })
    }))

  it('asks nothing of Drive while the account is disconnected', () =>
    withApp(async (app, drive) => {
      let { issue } = await unfinished(app, drive, 'Články')
      let setup = setupOn(app, drive, { ok: false, reason: 'disconnected' })
      let before = drive.calls.length

      assert.deepEqual(await finishIssue(setup, issue), { kind: 'disconnected' })
      assert.equal(drive.calls.length, before)
    }))
})
