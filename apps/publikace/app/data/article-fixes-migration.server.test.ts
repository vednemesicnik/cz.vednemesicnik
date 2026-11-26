import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { describe, it } from 'remix/test'

import { MIGRATIONS_DIRECTORY, openDatabase } from './database.server.ts'

/**
 * `20261206120000_article_fixes`: removing an author marks the issue's Evidence, as adding or
 * changing one does, and a batch keeps the name its request was sent under.
 */

const AT = '2026-11-20T09:00:00.000Z'

describe('the migration for fixing an article (#152)', () => {
  it('marks the Evidence when an author of a created article is removed', async () => {
    let opened = openDatabase(':memory:')
    try {
      let db = opened.database
      await db.migrate(await loadMigrations(MIGRATIONS_DIRECTORY))
      await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
          started_by_name)
        VALUES (1, 'VDM_2026_5', 'vdm_2026_5', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková')`)
      await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, created_at)
        VALUES (1, 'k7Qm2xR4pT9a', 'article', 1, ${AT})`)
      await db.exec(sql`INSERT INTO articles (id, issue_id, link_id, form_key, name, started_at,
          folder_id, doc_id, meta_file_id, created_at)
        VALUES (1, 1, 1, 'form-article', 'Školní jídelna po roce', ${AT}, 'folder-a', 'doc-a',
          'meta-a', ${AT})`)
      await db.exec(sql`INSERT INTO article_authors (article_id, position, name, email)
        VALUES (1, 1, 'Tereza Vlková', 'tereza.vlkova@external.test')`)
      await db.exec(sql`DELETE FROM record_marks`)

      await db.exec(sql`DELETE FROM article_authors WHERE article_id = 1`)
      let marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(
        (marks.rows ?? []).map((row) => [row['kind'], row['issue_id']]),
        [['evidence', 1]],
      )
      let columns = await db.exec(sql`SELECT name FROM pragma_table_info('artwork_batches')`)
      assert.ok((columns.rows ?? []).some((row) => row['name'] === 'sent_holder_name'))
    } finally {
      await opened.close()
    }
  })
})
