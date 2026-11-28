import * as assert from 'remix/assert'
import { type Database, sql } from 'remix/data-table'
import { loadMigrations } from 'remix/data-table/migrations/node'
import { describe, it } from 'remix/test'

import { MIGRATIONS_DIRECTORY, openDatabase } from './database.server.ts'
import { isRowId } from './row-id.server.ts'

/**
 * `20261211120000_cuid_row_ids` rebuilds every table that has a row ID or refers to one, with
 * the counted integers turned into CUIDs. A database from before it keeps every row, every
 * reference and the order its rows were written in, and the record's triggers fire as they did.
 */

const BEFORE = '20261210120000_job_starts'
const CUIDS = '20261211120000_cuid_row_ids'
const AT = '2026-11-20T09:00:00.000Z'
const LATER = '2026-11-21T09:00:00.000Z'

const COUNTED = [
  'access_accounts',
  'access_groups',
  'articles',
  'artwork_batches',
  'artwork_groups',
  'artworks',
  'article_clauses',
  'consent_answers',
  'final_versions',
  'issues',
  'job_runs',
  'job_starts',
  'links',
  'public_mail_log',
]

const SINGLE = ['drive_account', 'proofreaders', 'record_rewrites']

const EVERY_TABLE = [
  ...COUNTED,
  ...SINGLE,
  'article_authors',
  'comment_digests',
  'print_articles',
  'print_artworks',
  'print_group_artworks',
  'print_groups',
  'print_handoffs',
  'record_marks',
  'sessions',
]

/*
 * Every reference, read by what the rows say rather than by their IDs, so the same query gives
 * the same answer before the migration, after it and after its rollback.
 */
const REFERENCES = [
  `SELECT a.form_key, i.name, l.key FROM articles a
     JOIN issues i ON i.id = a.issue_id JOIN links l ON l.id = a.link_id ORDER BY a.form_key`,
  `SELECT a.form_key, au.position, au.email FROM article_authors au
     JOIN articles a ON a.id = au.article_id ORDER BY a.form_key, au.position`,
  `SELECT l.key, i.name, a.form_key AS article, g.form_key AS grp FROM links l
     JOIN issues i ON i.id = l.issue_id LEFT JOIN articles a ON a.id = l.article_id
     LEFT JOIN artwork_groups g ON g.id = l.group_id ORDER BY l.key`,
  `SELECT f.pdf_file_id, a.form_key, r.pdf_file_id AS replaces FROM final_versions f
     JOIN articles a ON a.id = f.article_id LEFT JOIN final_versions r ON r.id = f.replaces_version_id
     ORDER BY f.pdf_file_id`,
  `SELECT c.clause_key, f.pdf_file_id, a.form_key, r.clause_key AS replaces FROM article_clauses c
     JOIN final_versions f ON f.id = c.final_version_id JOIN articles a ON a.id = c.article_id
     LEFT JOIN article_clauses r ON r.id = c.replaces_clause_id ORDER BY c.clause_key`,
  `SELECT g.form_key, i.name FROM artwork_groups g JOIN issues i ON i.id = g.issue_id`,
  `SELECT b.form_key, i.name, a.form_key AS article, g.form_key AS grp, l.key
     FROM artwork_batches b JOIN issues i ON i.id = b.issue_id
     LEFT JOIN articles a ON a.id = b.article_id LEFT JOIN artwork_groups g ON g.id = b.group_id
     JOIN links l ON l.id = b.link_id ORDER BY b.form_key`,
  `SELECT w.upload_key, l.key, a.form_key AS article, g.form_key AS grp, b.form_key AS batch
     FROM artworks w JOIN links l ON l.id = w.link_id LEFT JOIN articles a ON a.id = w.article_id
     LEFT JOIN artwork_groups g ON g.id = w.group_id LEFT JOIN artwork_batches b ON b.id = w.batch_id
     ORDER BY w.upload_key`,
  `SELECT n.idempotency_key, b.form_key AS batch, c.clause_key FROM consent_answers n
     LEFT JOIN artwork_batches b ON b.id = n.batch_id
     LEFT JOIN article_clauses c ON c.id = n.clause_id ORDER BY n.idempotency_key`,
  `SELECT i.name, h.sheet_id FROM print_handoffs h JOIN issues i ON i.id = h.issue_id`,
  `SELECT a.form_key, i.name, f.pdf_file_id FROM print_articles p
     JOIN articles a ON a.id = p.article_id JOIN issues i ON i.id = p.issue_id
     LEFT JOIN final_versions f ON f.id = p.text_final_version_id`,
  `SELECT w.upload_key, a.form_key FROM print_artworks p
     JOIN artworks w ON w.id = p.artwork_id JOIN articles a ON a.id = p.article_id`,
  `SELECT g.form_key, i.name FROM print_groups p
     JOIN artwork_groups g ON g.id = p.group_id JOIN issues i ON i.id = p.issue_id`,
  `SELECT w.upload_key, g.form_key FROM print_group_artworks p
     JOIN artworks w ON w.id = p.artwork_id JOIN artwork_groups g ON g.id = p.group_id`,
  `SELECT a.form_key, d.reported_until FROM comment_digests d JOIN articles a ON a.id = d.article_id`,
  `SELECT m.kind, i.name FROM record_marks m LEFT JOIN issues i ON i.id = m.issue_id
     ORDER BY m.kind`,
]

async function rows(db: Database, text: string) {
  let result = await db.exec({ text, values: [] })
  return (result.rows ?? []).map((row) => ({ ...row }))
}

async function counts(db: Database) {
  let found: Record<string, number> = {}
  for (let table of EVERY_TABLE) {
    let [row] = await rows(db, `SELECT count(*) AS count FROM ${table}`)
    found[table] = Number(row?.['count'])
  }
  return found
}

async function references(db: Database) {
  let found = []
  for (let query of REFERENCES) found.push(await rows(db, query))
  return found
}

/* A row in every table, with two articles written in the order opposite to their names. */
async function seededBeforeCuids() {
  let opened = openDatabase(':memory:')
  let migrations = await loadMigrations(MIGRATIONS_DIRECTORY)
  await opened.database.migrate(migrations, { to: BEFORE })
  let db = opened.database
  await db.exec(sql`INSERT INTO access_accounts (id, email, is_admin, added_at)
    VALUES (1, 'marie@vednemesicnik.test', 1, ${AT})`)
  await db.exec(sql`INSERT INTO access_groups (id, email, name, added_at)
    VALUES (1, 'sefredakce@vednemesicnik.test', 'Šéfredakce', ${AT})`)
  await db.exec(sql`INSERT INTO sessions (id, email, data, created_at, expires_at, last_seen_at)
    VALUES ('session-1', 'marie@vednemesicnik.test', '{}', ${AT}, ${LATER}, ${AT})`)
  await db.exec(sql`INSERT INTO drive_account (id, email, refresh_token, connected_at,
      connected_by)
    VALUES (1, 'publikace.app@vednemesicnik.cz', 'sealed', ${AT}, 'marie@vednemesicnik.test')`)
  await db.exec(sql`INSERT INTO proofreaders (id, email, changed_at, changed_by_email)
    VALUES (1, 'korektura@vednemesicnik.test', ${AT}, 'marie@vednemesicnik.test')`)
  await db.exec(sql`UPDATE record_rewrites SET last_full_at = ${AT}`)
  await db.exec(sql`INSERT INTO issues (id, name, name_key, started_at, started_by_email,
      started_by_name, folder_id, articles_folder_id, print_folder_id, completed_at)
    VALUES (1, 'VDM_2003_1', 'vdm_2003_1', ${AT}, 'marie@vednemesicnik.test', 'Marie Horáková',
      'folder-issue', 'folder-articles', 'folder-print', ${AT})`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, created_at)
    VALUES (1, 'k7Qm2xR4pT9a', 'article', 1, ${AT})`)
  await db.exec(sql`INSERT INTO articles (id, issue_id, link_id, form_key, name, started_at,
      folder_id, doc_id, meta_file_id, created_at, artworks_folder_id, licences_folder_id)
    VALUES (2, 1, 1, 'form-a-second', 'Rozhovor s ředitelkou', ${AT}, 'folder-b', 'doc-b',
      'meta-b', ${AT}, 'folder-b-artworks', 'folder-b-licences')`)
  await db.exec(sql`INSERT INTO articles (id, issue_id, link_id, form_key, name, started_at,
      folder_id, doc_id, meta_file_id, created_at, artworks_folder_id, licences_folder_id)
    VALUES (1, 1, 1, 'form-b-first', 'Školní jídelna po roce', ${AT}, 'folder-a', 'doc-a',
      'meta-a', ${AT}, 'folder-a-artworks', 'folder-a-licences')`)
  await db.exec(sql`INSERT INTO article_authors (article_id, position, name, email)
    VALUES (1, 1, 'Tereza Vlková', 'tereza.vlkova@external.test')`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, article_id, created_at)
    VALUES (2, 'w9Lc4tB2nK7d', 'artworks', 1, 1, ${AT})`)
  await db.exec(sql`INSERT INTO artwork_groups (id, issue_id, form_key, name, name_key,
      started_at, started_by_email, started_by_name, folder_id, artworks_folder_id,
      licences_folder_id, meta_file_id, created_at)
    VALUES (1, 1, 'form-group', 'Mapa obce', 'mapa obce', ${AT}, 'marie@vednemesicnik.test',
      'Marie Horáková', 'folder-g', 'folder-g-artworks', 'folder-g-licences', 'meta-g', ${AT})`)
  await db.exec(sql`INSERT INTO links (id, key, kind, issue_id, group_id, created_at)
    VALUES (3, 'p3Vd8nL1sQ6e', 'artworks', 1, 1, ${AT})`)
  await db.exec(sql`INSERT INTO final_versions (id, article_id, marked_at, marked_by_email,
      pdf_file_id, pdf_hash, attempt_key, replaced_at)
    VALUES (1, 1, ${AT}, 'korektura@vednemesicnik.test', 'pdf-1', 'hash-1', 'attempt-1', ${LATER})`)
  await db.exec(sql`INSERT INTO final_versions (id, article_id, marked_at, marked_by_email,
      pdf_file_id, pdf_hash, attempt_key, replaces_version_id)
    VALUES (2, 1, ${LATER}, 'korektura@vednemesicnik.test', 'pdf-2', 'hash-2', 'attempt-2', 1)`)
  await db.exec(sql`INSERT INTO article_clauses (id, final_version_id, article_id, position,
      author_name, author_email, signature, clause_key)
    VALUES (1, 1, 1, 1, 'Tereza Vlková', 'tereza.vlkova@external.test', 'Tereza Vlková',
      'clause-1')`)
  await db.exec(sql`INSERT INTO article_clauses (id, final_version_id, article_id, position,
      author_name, author_email, signature, clause_key, replaces_clause_id)
    VALUES (2, 2, 1, 1, 'Tereza Vlková', 'tereza.vlkova@external.test', 'Tereza Vlková',
      'clause-2', 1)`)
  await db.exec(sql`INSERT INTO artwork_batches (id, issue_id, article_id, link_id, form_key,
      provider_name, provider_email, tag, started_at, created_at, mail_sent_at)
    VALUES (1, 1, 1, 2, 'form-batch-article', 'Tereza Vlková', 'tereza.vlkova@external.test',
      '20261120T100000', ${AT}, ${AT}, ${AT})`)
  await db.exec(sql`INSERT INTO artwork_batches (id, issue_id, group_id, link_id, form_key,
      provider_name, provider_email, tag, started_at, created_at)
    VALUES (2, 1, 1, 3, 'form-batch-group', 'Klára Šimková', 'klara.simkova@external.test',
      '20261120T110000', ${AT}, ${AT})`)
  await db.exec(sql`INSERT INTO artworks (id, link_id, article_id, form_key, upload_key,
      drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at,
      batch_id, position)
    VALUES (1, 2, 1, 'form-page', 'upload-1', 'file-1', 'jidelna.jpg', 'abc.jpg', 'image/jpeg',
      1000, 1, ${AT}, 1, 1)`)
  await db.exec(sql`INSERT INTO artworks (id, link_id, group_id, form_key, upload_key,
      drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at,
      batch_id, position)
    VALUES (2, 3, 1, 'form-group-page', 'upload-2', 'file-2', 'mapa.jpg', 'def.jpg',
      'image/jpeg', 1000, 1, ${AT}, 2, 1)`)
  await db.exec(sql`INSERT INTO consent_answers (id, batch_id, in_reply_to_message_id,
      reply_received_at, reply_text, text, editor_email, editor_name, idempotency_key, started_at)
    VALUES (1, 1, 'message-1', ${AT}, 'ok', 'Děkujeme.', 'marie@vednemesicnik.test',
      'Marie Horáková', 'answer-1', ${AT})`)
  await db.exec(sql`INSERT INTO consent_answers (id, clause_id, in_reply_to_message_id,
      reply_received_at, reply_text, text, editor_email, editor_name, idempotency_key, started_at)
    VALUES (2, 2, 'message-2', ${AT}, 'ok', 'Děkujeme.', 'marie@vednemesicnik.test',
      'Marie Horáková', 'answer-2', ${AT})`)
  await db.exec(sql`INSERT INTO print_handoffs (issue_id, sheet_id) VALUES (1, 'sheet-1')`)
  await db.exec(sql`INSERT INTO print_articles (article_id, issue_id, folder_id,
      text_final_version_id)
    VALUES (1, 1, 'folder-print-a', 2)`)
  await db.exec(sql`INSERT INTO print_artworks (artwork_id, article_id, copy_file_id, name)
    VALUES (1, 1, 'copy-1', 'obr-01.jpg')`)
  await db.exec(sql`INSERT INTO print_groups (group_id, issue_id, folder_id)
    VALUES (1, 1, 'folder-print-g')`)
  await db.exec(sql`INSERT INTO print_group_artworks (artwork_id, group_id, copy_file_id, name)
    VALUES (2, 1, 'copy-2', 'obr-02.jpg')`)
  await db.exec(sql`INSERT INTO comment_digests (article_id, reported_until) VALUES (1, ${AT})`)
  await db.exec(sql`INSERT INTO job_runs (id, job, run_key, started_at, interval_minutes)
    VALUES (1, 'artwork-replies', 'run-1', ${AT}, 10)`)
  await db.exec(sql`INSERT INTO job_starts (id, job, start_key, requested_by_email,
      requested_by_name, requested_at, run_key)
    VALUES (1, 'artwork-replies', 'start-1', 'marie@vednemesicnik.test', 'Marie Horáková', ${AT},
      'run-1')`)
  await db.exec(sql`INSERT INTO public_mail_log (id, kind, sent_at) VALUES (1, 'welcome', ${AT})`)
  return { db, migrations, opened }
}

describe('the CUID row IDs migration (#1125)', () => {
  it('keeps every row and every reference, with a CUID for every counted ID', async () => {
    let { db, migrations, opened } = await seededBeforeCuids()
    try {
      let countsBefore = await counts(db)
      let referencesBefore = await references(db)
      assert.ok(referencesBefore.at(-1)?.length === 2)

      await db.migrate(migrations, { to: CUIDS })

      assert.deepEqual(await counts(db), countsBefore)
      assert.deepEqual(await references(db), referencesBefore)
      for (let table of COUNTED) {
        for (let row of await rows(db, `SELECT id FROM ${table}`)) {
          assert.ok(isRowId(row['id']), `${table}: ${String(row['id'])}`)
        }
      }
      for (let table of SINGLE) {
        assert.deepEqual(await rows(db, `SELECT id FROM ${table}`), [{ id: 1 }])
      }
      assert.deepEqual(
        await rows(db, `SELECT kind, issue_id FROM record_marks WHERE kind = 'registry'`),
        [{ issue_id: '', kind: 'registry' }],
      )
      assert.deepEqual(await rows(db, 'PRAGMA foreign_key_check'), [])
      assert.deepEqual(await rows(db, 'PRAGMA integrity_check'), [{ integrity_check: 'ok' }])
    } finally {
      await opened.close()
    }
  })

  it('keeps the order the rows were written in for ORDER BY rowid', async () => {
    let { db, migrations, opened } = await seededBeforeCuids()
    try {
      let before = await rows(db, 'SELECT form_key FROM articles ORDER BY id')
      await db.migrate(migrations, { to: CUIDS })
      assert.deepEqual(await rows(db, 'SELECT form_key FROM articles ORDER BY rowid'), before)
    } finally {
      await opened.close()
    }
  })

  it('marks the record from the rebuilt tables, the Registr by an empty issue', async () => {
    let { db, migrations, opened } = await seededBeforeCuids()
    try {
      await db.migrate(migrations, { to: CUIDS })
      let [issue] = await rows(db, 'SELECT id FROM issues')
      await db.exec(sql`DELETE FROM record_marks`)

      await db.exec(
        sql`UPDATE articles SET name = 'Jídelna po roce' WHERE form_key = 'form-b-first'`,
      )
      await db.exec(sql`UPDATE links SET revoked_at = ${LATER} WHERE key = 'k7Qm2xR4pT9a'`)

      assert.deepEqual(await rows(db, 'SELECT kind, issue_id FROM record_marks ORDER BY kind'), [
        { issue_id: String(issue?.['id']), kind: 'evidence' },
        { issue_id: '', kind: 'registry' },
      ])
    } finally {
      await opened.close()
    }
  })

  it('refuses a row without an ID', async () => {
    let { db, migrations, opened } = await seededBeforeCuids()
    try {
      await db.migrate(migrations, { to: CUIDS })
      await assert.rejects(
        db.exec(sql`INSERT INTO public_mail_log (kind, sent_at) VALUES ('welcome', ${AT})`),
      )
    } finally {
      await opened.close()
    }
  })

  it('rolls back to counted integers in the order the rows were written', async () => {
    let { db, migrations, opened } = await seededBeforeCuids()
    try {
      let countsBefore = await counts(db)
      let referencesBefore = await references(db)
      let orderBefore = await rows(db, 'SELECT form_key FROM articles ORDER BY id')
      await db.migrate(migrations, { to: CUIDS })

      await db.migrate(migrations, { direction: 'down', step: 1 })

      assert.deepEqual(await counts(db), countsBefore)
      assert.deepEqual(await references(db), referencesBefore)
      assert.deepEqual(await rows(db, 'SELECT form_key FROM articles ORDER BY id'), orderBefore)
      for (let row of await rows(db, 'SELECT id FROM issues')) {
        assert.equal(typeof row['id'], 'number')
      }
      assert.deepEqual(
        await rows(db, `SELECT kind, issue_id FROM record_marks WHERE kind = 'registry'`),
        [{ issue_id: 0, kind: 'registry' }],
      )
      assert.deepEqual(await rows(db, 'PRAGMA foreign_key_check'), [])
    } finally {
      await opened.close()
    }
  })
})
