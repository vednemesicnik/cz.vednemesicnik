import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { describe, it } from 'remix/test'

import { MIGRATIONS_DIRECTORY, openDatabase } from './database.server.ts'

/**
 * `20261203120000_artwork_groups` rebuilds `links`, `artwork_batches` and `artworks`, the first
 * migration here that drops a table rows refer to. A database from before it keeps every row and
 * every reference, and the record's triggers fire on the rebuilt tables as they did.
 */

const BEFORE = '20261202120000_consent_answers'
const GROUPS = '20261203120000_artwork_groups'
const AT = '2026-11-20T09:00:00.000Z'

async function seededBeforeGroups() {
  let opened = openDatabase(':memory:')
  let migrations = await loadMigrations(MIGRATIONS_DIRECTORY)
  await opened.database.migrate(migrations, { to: BEFORE })
  let db = opened.database
  await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
      started_by_name, folder_id, articles_folder_id, print_folder_id, completed_at)
    VALUES (1, 'VDM_2026_5', 'vdm_2026_5', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková',
      'folder-issue', 'folder-articles', 'folder-print', ${AT})`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, created_at)
    VALUES (1, 'k7Qm2xR4pT9a', 'article', 1, ${AT})`)
  await db.exec(sql`INSERT INTO articles (id, issue_id, link_id, form_key, name, started_at,
      folder_id, doc_id, meta_file_id, created_at, artworks_folder_id, licences_folder_id)
    VALUES (1, 1, 1, 'form-article', 'Školní jídelna po roce', ${AT}, 'folder-a', 'doc-a',
      'meta-a', ${AT}, 'folder-a-artworks', 'folder-a-licences')`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, article_id, created_at)
    VALUES (2, 'w9Lc4tB2nK7d', 'artworks', 1, 1, ${AT})`)
  await db.exec(sql`INSERT INTO artwork_batches (id, issue_id, article_id, link_id, form_key,
      provider_name, provider_email, tag, started_at, created_at, mail_sent_at,
      reply_message_id, reply_received_at, answered_message_id, answered_at)
    VALUES (1, 1, 1, 2, 'form-batch', 'Tereza Vlková', 'tereza.vlkova@external.test',
      '20261120T100000', ${AT}, ${AT}, ${AT}, 'message-1', ${AT}, 'message-1', ${AT})`)
  await db.exec(sql`INSERT INTO artworks (id, link_id, article_id, form_key, upload_key,
      drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at,
      batch_id, position, author, source)
    VALUES (1, 2, 1, 'form-page', 'upload-1', 'file-1', 'jidelna-1.jpg', 'abc.jpg',
      'image/jpeg', 1000, 1, ${AT}, 1, 1, 'Tereza Vlková', '')`)
  await db.exec(sql`INSERT INTO consent_answers (batch_id, in_reply_to_message_id,
      reply_received_at, reply_text, text, editor_email, editor_name, idempotency_key, started_at)
    VALUES (1, 'message-1', ${AT}, 'ok', 'Děkujeme.', 'marie@vednemesicnik.test',
      'Marie Horáková', 'answer-1', ${AT})`)
  await db.exec(sql`INSERT INTO print_articles (article_id, issue_id, folder_id)
    VALUES (1, 1, 'folder-print-a')`)
  await db.exec(sql`INSERT INTO print_artworks (artwork_id, article_id, copy_file_id, name)
    VALUES (1, 1, 'copy-1', 'obr-01.jpg')`)
  return { db, migrations, opened }
}

async function count(db: Awaited<ReturnType<typeof seededBeforeGroups>>['db'], table: string) {
  let result = await db.exec({ text: `SELECT count(*) AS count FROM ${table}`, values: [] })
  return Number(result.rows?.[0]?.['count'])
}

describe('the artwork groups migration', () => {
  it('keeps every row and every reference through the rebuilt tables', async () => {
    let { db, migrations, opened } = await seededBeforeGroups()
    try {
      await db.migrate(migrations)

      for (let table of [
        'links',
        'artwork_batches',
        'artworks',
        'consent_answers',
        'print_artworks',
      ]) {
        assert.ok((await count(db, table)) > 0, table)
      }
      let broken = await db.exec(sql`PRAGMA foreign_key_check`)
      assert.deepEqual(broken.rows, [])
      let integrity = await db.exec(sql`PRAGMA integrity_check`)
      assert.deepEqual(integrity.rows, [{ integrity_check: 'ok' }])
      let keys = await db.exec(sql`PRAGMA foreign_keys`)
      assert.deepEqual(keys.rows, [{ foreign_keys: 1 }])

      let batch = await db.exec(sql`SELECT article_id, group_id, answered_message_id
        FROM artwork_batches WHERE id = 1`)
      assert.deepEqual(batch.rows, [
        { answered_message_id: 'message-1', article_id: 1, group_id: null },
      ])
    } finally {
      await opened.close()
    }
  })

  it('marks the Evidence from the rebuilt tables, as before', async () => {
    let { db, migrations, opened } = await seededBeforeGroups()
    try {
      await db.migrate(migrations)
      await db.exec(sql`DELETE FROM record_marks`)

      await db.exec(sql`UPDATE artworks SET author = 'Klára Šimková' WHERE id = 1`)
      let marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(marks.rows, [{ issue_id: 1, kind: 'evidence' }])

      await db.exec(sql`DELETE FROM record_marks`)
      await db.exec(sql`UPDATE links SET revoked_at = ${AT} WHERE id = 1`)
      marks = await db.exec(sql`SELECT kind, issue_id FROM record_marks`)
      assert.deepEqual(marks.rows, [{ issue_id: 0, kind: 'registry' }])
    } finally {
      await opened.close()
    }
  })

  it('refuses a batch that belongs to both an article and a group, or to neither', async () => {
    let { db, migrations, opened } = await seededBeforeGroups()
    try {
      await db.migrate(migrations)
      await assert.rejects(db.exec(sql`UPDATE artwork_batches SET article_id = NULL WHERE id = 1`))
    } finally {
      await opened.close()
    }
  })

  it('rolls back to the tables before groups, dropping the groups’ rows and keeping the articles’', async () => {
    let { db, migrations, opened } = await seededBeforeGroups()
    try {
      /* Up to this migration and no further, so that one step down undoes this one. */
      await db.migrate(migrations, { to: GROUPS })
      /* A group with everything that hangs on it, which the rollback takes away first. */
      await db.exec(sql`INSERT INTO artwork_groups (id, issue_id, form_key, name, name_key,
          started_at, started_by_email, started_by_name, folder_id, artworks_folder_id,
          licences_folder_id, meta_file_id, created_at)
        VALUES (1, 1, 'form-group', 'Obálka', 'obálka', ${AT}, 'marie@vednemesicnik.test',
          'Marie Horáková', 'folder-g', 'folder-g-artworks', 'folder-g-licences', 'meta-g', ${AT})`)
      await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, group_id, created_at)
        VALUES (3, 'p3Vd8nL1sQ6e', 'artworks', 1, 1, ${AT})`)
      await db.exec(sql`INSERT INTO artwork_batches (id, issue_id, group_id, link_id, form_key,
          provider_name, provider_email, tag, started_at, created_at)
        VALUES (2, 1, 1, 3, 'form-group-batch', 'Klára Šimková', 'klara.simkova@external.test',
          '20261120T110000', ${AT}, ${AT})`)
      await db.exec(sql`INSERT INTO artworks (id, link_id, group_id, form_key, upload_key,
          drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at,
          batch_id, position)
        VALUES (2, 3, 1, 'form-group-page', 'upload-2', 'file-2', 'obalka.jpg', 'def.jpg',
          'image/jpeg', 1000, 1, ${AT}, 2, 1)`)
      await db.exec(sql`INSERT INTO consent_answers (batch_id, in_reply_to_message_id,
          reply_received_at, reply_text, text, editor_email, editor_name, idempotency_key,
          started_at)
        VALUES (2, 'message-2', ${AT}, 'ok', 'Děkujeme.', 'marie@vednemesicnik.test',
          'Marie Horáková', 'answer-2', ${AT})`)
      await db.exec(sql`INSERT INTO print_groups (group_id, issue_id, folder_id)
        VALUES (1, 1, 'folder-print-g')`)
      await db.exec(sql`INSERT INTO print_group_artworks (artwork_id, group_id, copy_file_id, name)
        VALUES (2, 1, 'copy-2', 'obr-01.jpg')`)

      await db.migrate(migrations, { direction: 'down', step: 1 })

      assert.equal(await count(db, 'links'), 2)
      assert.equal(await count(db, 'artwork_batches'), 1)
      assert.equal(await count(db, 'consent_answers'), 1)
      assert.equal(await count(db, 'artworks'), 1)
      assert.equal(await count(db, 'print_artworks'), 1)
      let broken = await db.exec(sql`PRAGMA foreign_key_check`)
      assert.deepEqual(broken.rows, [])
      let tables = await db.exec(
        sql`SELECT name FROM sqlite_master WHERE name IN ('artwork_groups', 'print_groups')`,
      )
      assert.deepEqual(tables.rows, [])
    } finally {
      await opened.close()
    }
  })
})
