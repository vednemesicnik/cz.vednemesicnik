import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createTestApp } from '../test-app.server.ts'
import { createIssueStore } from './issues.server.ts'

const STARTED = {
  startedByEmail: 'marie@vednemesicnik.test',
  startedByName: 'Marie Horáková',
}

function at(day: number): Temporal.Instant {
  return Temporal.Instant.from(`2026-11-${String(day).padStart(2, '0')}T09:00:00Z`)
}

describe('the issue store', () => {
  it('writes the row first, without any folder, as unfinished', async () => {
    let app = await createTestApp()
    try {
      let store = createIssueStore(app.database)
      let result = await store.insert({ ...STARTED, at: at(14), name: ' VDM_2026_6 ' })

      assert.equal(result.ok, true)
      if (!result.ok) return
      assert.equal(result.issue.name, 'VDM_2026_6')
      assert.deepEqual(result.issue.folderIds, { articles: null, issue: null, print: null })
      assert.equal(result.issue.completedAt, null)
    } finally {
      await app.close()
    }
  })

  it('refuses a name already in the app, whatever its case', async () => {
    let app = await createTestApp()
    try {
      let store = createIssueStore(app.database)
      await store.insert({ ...STARTED, at: at(3), name: 'VDM_2026_5' })

      let again = await store.insert({ ...STARTED, at: at(4), name: 'vdm_2026_5' })
      assert.deepEqual(again, { existingName: 'VDM_2026_5', ok: false })
      assert.equal((await store.list()).length, 1)
    } finally {
      await app.close()
    }
  })

  it('keeps each folder and completes only with all three', async () => {
    let app = await createTestApp()
    try {
      let store = createIssueStore(app.database)
      let result = await store.insert({ ...STARTED, at: at(14), name: 'VDM_2026_6' })
      if (!result.ok) throw new Error('not inserted')
      let id = result.issue.id

      await store.setFolder(id, 'issue', 'f-issue')
      await assert.rejects(() => store.complete(id, at(14)))

      await store.setFolder(id, 'articles', 'f-articles')
      await store.setFolder(id, 'print', 'f-print')
      await store.complete(id, at(14))

      let issue = await store.findByName('vdm_2026_6')
      assert.deepEqual(issue?.folderIds, {
        articles: 'f-articles',
        issue: 'f-issue',
        print: 'f-print',
      })
      assert.ok(issue?.completedAt !== null)
    } finally {
      await app.close()
    }
  })

  it('lists unfinished, then active, then closed, newest first', async () => {
    let app = await createTestApp()
    try {
      let store = createIssueStore(app.database)
      for (let [name, day] of [
        ['VDM_2026_3', 1],
        ['VDM_2026_4', 2],
        ['VDM_2026_5', 3],
        ['VDM_2026_6', 4],
      ] as const) {
        let result = await store.insert({ ...STARTED, at: at(day), name })
        if (!result.ok) throw new Error('not inserted')
        if (name === 'VDM_2026_6') continue
        for (let kind of ['issue', 'articles', 'print'] as const) {
          await store.setFolder(result.issue.id, kind, `${name}-${kind}`)
        }
        await store.complete(result.issue.id, at(day))
      }
      await app.database.exec(
        sql`UPDATE issues SET closed_at = ${'2026-11-10T09:00:00.000Z'} WHERE name = 'VDM_2026_5'`,
      )

      let names = (await store.list()).map((issue) => issue.name)
      assert.deepEqual(names, ['VDM_2026_6', 'VDM_2026_4', 'VDM_2026_3', 'VDM_2026_5'])
    } finally {
      await app.close()
    }
  })

  it('removes a row, after which the name is free again', async () => {
    let app = await createTestApp()
    try {
      let store = createIssueStore(app.database)
      let result = await store.insert({ ...STARTED, at: at(14), name: 'VDM_2026_6' })
      if (!result.ok) throw new Error('not inserted')

      await store.remove(result.issue.id)
      assert.equal(await store.findByName('VDM_2026_6'), null)
      assert.equal((await store.insert({ ...STARTED, at: at(14), name: 'VDM_2026_6' })).ok, true)
    } finally {
      await app.close()
    }
  })
})
