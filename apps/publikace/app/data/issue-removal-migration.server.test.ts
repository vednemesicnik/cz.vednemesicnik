import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { describe, it } from 'remix/test'

import { MIGRATIONS_DIRECTORY, openDatabase } from './database.server.ts'

/**
 * `20261205120000_issue_removal` rebuilds `issues`, which every other table of an issue refers
 * to. A database from before it keeps every row and every reference, the name stays unique among
 * the issues not removed, and the record's triggers fire on the rebuilt table as they did.
 */

const BEFORE = '20261204120000_issue_folder_marks'
const REMOVAL = '20261205120000_issue_removal'
const AT = '2026-11-20T09:00:00.000Z'

async function seededBeforeRemoval() {
  let opened = openDatabase(':memory:')
  let migrations = await loadMigrations(MIGRATIONS_DIRECTORY)
  await opened.database.migrate(migrations, { to: BEFORE })
  let db = opened.database
  await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
      started_by_name, folder_id, articles_folder_id, print_folder_id, completed_at,
      evidence_spreadsheet_id)
    VALUES (1, 'VDM_2026_5', 'vdm_2026_5', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková',
      'folder-issue', 'folder-articles', 'folder-print', ${AT}, 'sheet-evidence')`)
  await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
      started_by_name)
    VALUES (2, 'VDM_2026_6', 'vdm_2026_6', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková')`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, created_at)
    VALUES (1, 'k7Qm2xR4pT9a', 'article', 1, ${AT})`)
  await db.exec(sql`INSERT INTO articles (id, issue_id, link_id, form_key, name, started_at,
      folder_id, doc_id, meta_file_id, created_at)
    VALUES (1, 1, 1, 'form-article', 'Školní jídelna po roce', ${AT}, 'folder-a', 'doc-a',
      'meta-a', ${AT})`)
  await db.exec(sql`INSERT INTO print_handoffs (issue_id, sheet_id) VALUES (1, 'sheet-podklady')`)
  return { db, migrations, opened }
}

type Db = Awaited<ReturnType<typeof seededBeforeRemoval>>['db']

async function count(db: Db, table: string) {
  let result = await db.exec({ text: `SELECT count(*) AS count FROM ${table}`, values: [] })
  return Number(result.rows?.[0]?.['count'])
}

describe('the issue removal migration', () => {
  it('keeps every issue and every reference through the rebuilt table', async () => {
    let { db, migrations, opened } = await seededBeforeRemoval()
    try {
      await db.migrate(migrations)

      assert.equal(await count(db, 'issues'), 2)
      assert.equal(await count(db, 'articles'), 1)
      assert.equal(await count(db, 'print_handoffs'), 1)
      let issue = await db.exec(sql`SELECT name, folder_id, evidence_spreadsheet_id, removed_at
        FROM issues WHERE id = 1`)
      assert.deepEqual(issue.rows, [
        {
          evidence_spreadsheet_id: 'sheet-evidence',
          folder_id: 'folder-issue',
          name: 'VDM_2026_5',
          removed_at: null,
        },
      ])
      let broken = await db.exec(sql`PRAGMA foreign_key_check`)
      assert.deepEqual(broken.rows, [])
      let integrity = await db.exec(sql`PRAGMA integrity_check`)
      assert.deepEqual(integrity.rows, [{ integrity_check: 'ok' }])
      let keys = await db.exec(sql`PRAGMA foreign_keys`)
      assert.deepEqual(keys.rows, [{ foreign_keys: 1 }])
    } finally {
      await opened.close()
    }
  })

  it('frees the name of a removed issue and keeps it taken for every other', async () => {
    let { db, migrations, opened } = await seededBeforeRemoval()
    try {
      await db.migrate(migrations)
      let insert = (id: number) =>
        db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
            started_by_name)
          VALUES (${id}, 'vdm_2026_6', 'vdm_2026_6', ${AT}, 'marie@vednemesicnik.test',
            'Marie Horáková')`)

      await assert.rejects(insert(3))
      await db.exec(sql`UPDATE issues SET removed_at = ${AT} WHERE id = 2`)
      await insert(3)
      await assert.rejects(insert(4))
    } finally {
      await opened.close()
    }
  })

  it('marks the Registr when a complete issue is renamed or removed, as before', async () => {
    let { db, migrations, opened } = await seededBeforeRemoval()
    try {
      await db.migrate(migrations)
      await db.exec(sql`DELETE FROM record_marks`)

      await db.exec(sql`UPDATE issues SET name = 'VDM_2026_7', name_key = 'vdm_2026_7'
        WHERE id = 1`)
      let marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(marks.rows, [{ issue_id: 0, kind: 'registry' }])

      await db.exec(sql`DELETE FROM record_marks`)
      await db.exec(sql`UPDATE issues SET removed_at = ${AT} WHERE id = 1`)
      marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(marks.rows, [{ issue_id: 0, kind: 'registry' }])

      /* An unfinished issue has no row in the Registr, so removing it marks nothing. */
      await db.exec(sql`DELETE FROM record_marks`)
      await db.exec(sql`UPDATE issues SET removed_at = ${AT} WHERE id = 2`)
      assert.equal(await count(db, 'record_marks'), 0)

      await db.exec(sql`UPDATE issues SET folder_id = 'f', articles_folder_id = 'a',
          print_folder_id = 'p', completed_at = ${AT}
        WHERE id = 2`)
      marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks ORDER BY kind`)
      assert.deepEqual(marks.rows, [
        { issue_id: 2, kind: 'evidence' },
        { issue_id: 0, kind: 'registry' },
      ])
    } finally {
      await opened.close()
    }
  })

  it('rolls back to a name unique among every issue', async () => {
    let { db, migrations, opened } = await seededBeforeRemoval()
    try {
      await db.migrate(migrations, { to: REMOVAL })
      await db.exec(sql`UPDATE issues SET removed_at = ${AT} WHERE id = 2`)

      await db.migrate(migrations, { direction: 'down', step: 1 })

      assert.equal(await count(db, 'issues'), 2)
      let columns = await db.exec(sql`SELECT name FROM pragma_table_info('issues')
        WHERE name = 'removed_at'`)
      assert.deepEqual(columns.rows, [])
      await assert.rejects(
        db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
            started_by_name)
          VALUES (3, 'VDM_2026_6', 'vdm_2026_6', ${AT}, 'marie@vednemesicnik.test',
            'Marie Horáková')`),
      )
      let broken = await db.exec(sql`PRAGMA foreign_key_check`)
      assert.deepEqual(broken.rows, [])
    } finally {
      await opened.close()
    }
  })
})
