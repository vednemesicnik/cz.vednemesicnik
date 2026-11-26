import * as assert from 'remix/assert'
import { type Database, sql } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { describe, it } from 'remix/test'

import { MIGRATIONS_DIRECTORY, openDatabase } from './database.server.ts'

/**
 * `20261208120000_artwork_group_fixes`: a group gains `removed_at`, removing a created one marks
 * the issue's Evidence, and a removed group's name is free again in its issue.
 */

const AT = '2026-11-20T09:00:00.000Z'

async function withGroup(run: (db: Database) => Promise<void>): Promise<void> {
  let opened = openDatabase(':memory:')
  try {
    let db = opened.database
    await db.migrate(await loadMigrations(MIGRATIONS_DIRECTORY))
    await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
        started_by_name)
      VALUES (1, 'VDM_2003_1', 'vdm_2003_1', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková')`)
    await db.exec(sql`INSERT INTO artwork_groups (id, issue_id, form_key, name, name_key,
        started_at, started_by_email, started_by_name, folder_id, artworks_folder_id,
        licences_folder_id, meta_file_id, created_at)
      VALUES (1, 1, 'form-group', 'Mapa obce', 'mapa obce', ${AT}, 'marie@vednemesicnik.test',
        'Marie Horáková', 'folder-g', 'artworks-g', 'licences-g', 'meta-g', ${AT})`)
    await db.exec(sql`DELETE FROM record_marks`)
    await run(db)
  } finally {
    await opened.close()
  }
}

describe('the migration for correcting and removing an artwork group (#154)', () => {
  it('marks the Evidence when a created group is removed', async () => {
    await withGroup(async (db) => {
      await db.exec(sql`UPDATE artwork_groups SET removed_at = ${AT} WHERE id = 1`)
      let marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(
        (marks.rows ?? []).map((row) => [row['kind'], row['issue_id']]),
        [['evidence', 1]],
      )
    })
  })

  it('frees a removed group’s name, and keeps a live one’s taken', async () => {
    await withGroup(async (db) => {
      let insertSecond = (formKey: string) =>
        db.exec(sql`INSERT INTO artwork_groups (issue_id, form_key, name, name_key, started_at,
            started_by_email, started_by_name)
          VALUES (1, ${formKey}, 'Mapa obce', 'mapa obce', ${AT}, 'marie@vednemesicnik.test',
            'Marie Horáková')`)
      await assert.rejects(() => insertSecond('form-second'))

      await db.exec(sql`UPDATE artwork_groups SET removed_at = ${AT} WHERE id = 1`)
      await insertSecond('form-third')
      let count = await db.exec(sql`SELECT count(*) AS count FROM artwork_groups`)
      assert.equal(Number(count.rows?.[0]?.['count']), 2)
    })
  })
})
