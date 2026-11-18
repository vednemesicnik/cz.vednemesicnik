import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import type { ArtworkCounts, ArtworkState } from '../domain/artwork.ts'
import { batchState, batchTag, NO_ARTWORKS } from '../domain/artwork.ts'
import { parseStamp, stamp } from '../domain/time.ts'

/**
 * Artworks in the app's database, the source of truth for them, and the batches that send them.
 *
 * An upload is a row the moment Drive has stored its file, and belongs to the page that uploaded
 * it (its form key) until a batch takes it. A batch is written before Drive is asked for its
 * licences and keeps each licence's IDs the moment Drive returns them, so a failed one knows what
 * to put in the bin (`11c`). Only a committed batch is one; nothing else reads an attempt.
 */

export type ArtworkRow = {
  articleId: number
  author: string | null
  batchId: number | null
  driveFileId: string
  formKey: string
  id: number
  isReadable: boolean
  licenceDocId: string | null
  licenceFileId: string | null
  licenceHash: string | null
  linkId: number
  mimeType: string
  originalName: string
  position: number | null
  removedAt: Temporal.Instant | null
  size: number
  source: string | null
  storedName: string
  uploadKey: string
  uploadedAt: Temporal.Instant
}

export type BatchRow = {
  articleId: number
  /** The batch's artworks in their order. */
  artworks: ArtworkRow[]
  cleanupAt: Temporal.Instant | null
  createdAt: Temporal.Instant | null
  discardedAt: Temporal.Instant | null
  formKey: string
  id: number
  issueId: number
  linkId: number
  mailFailedAt: Temporal.Instant | null
  mailRefusedAt: Temporal.Instant | null
  mailSentAt: Temporal.Instant | null
  providerEmail: string
  providerName: string
  startedAt: Temporal.Instant
  tag: string
}

/** A batch as the issue's detail lists it, with the article it belongs to. */
export type ListedBatch = BatchRow & { articleName: string; createdAt: Temporal.Instant }

export type NewUpload = {
  articleId: number
  at: Temporal.Instant
  driveFileId: string
  formKey: string
  isReadable: boolean
  linkId: number
  mimeType: string
  originalName: string
  size: number
  storedName: string
  uploadKey: string
}

export type NewBatch = {
  articleId: number
  artworks: readonly { author: string; id: number; source: string }[]
  at: Temporal.Instant
  formKey: string
  issueId: number
  linkId: number
  provider: { email: string; name: string }
}

export type ArtworkStore = {
  /** Every batch attempt left uncommitted, for the cleanup at startup. */
  abandonedBatches(): Promise<BatchRow[]>
  addUpload(upload: NewUpload): Promise<ArtworkRow>
  /** Committed batches per issue: how many artworks, and how many wait on the editors. */
  countsByIssue(): Promise<Map<number, { total: number; waiting: number }>>
  /** The artworks of the issue's committed batches per article, by their state (`12a`). */
  countsByArticle(issueId: number): Promise<Map<number, ArtworkCounts>>
  commitBatch(id: number, at: Temporal.Instant): Promise<BatchRow>
  /**
   * Removes a failed attempt whose licences are in the bin. Its artworks go back to their page,
   * unsent and without the fields the attempt gave them.
   */
  discardAttempt(id: number): Promise<void>
  /** The editors discarded a committed batch: it stays as a record, its files are in the bin. */
  discardBatch(id: number, at: Temporal.Instant): Promise<void>
  /** Uploads never sent and never removed, uploaded before a moment (`21d`, 24 hours). */
  expiredUploads(before: Temporal.Instant): Promise<ArtworkRow[]>
  findBatch(id: number): Promise<BatchRow | null>
  findBatchByFormKey(formKey: string): Promise<BatchRow | null>
  findUpload(id: number): Promise<ArtworkRow | null>
  /** The issue's committed batches the editors have not discarded, newest first. */
  listByIssue(issueId: number): Promise<ListedBatch[]>
  markForCleanup(id: number, at: Temporal.Instant): Promise<void>
  /**
   * The Mailer's answer to a batch's request. `sent` is final; `refused` is the Mailer refusing it
   * for good, `failed` a request it never confirmed.
   */
  markMail(id: number, outcome: 'failed' | 'refused' | 'sent', at: Temporal.Instant): Promise<void>
  markRemoved(id: number, at: Temporal.Instant): Promise<void>
  /** Batch attempts whose cleanup failed, safe to take while other requests run. */
  pendingCleanups(): Promise<BatchRow[]>
  /**
   * The distinct addresses a link's batches went to since a moment, in lower case, those still
   * making their licences included, so sends in parallel cannot pass the limit of five. A failed
   * attempt's row is gone and no longer counts.
   */
  recipientsSince(linkId: number, since: Temporal.Instant): Promise<string[]>
  /** Batches through a link since a moment, under way or committed: what the limit counts. */
  recentBatches(linkId: number, since: Temporal.Instant): Promise<number>
  setLicenceDoc(artworkId: number, docId: string): Promise<void>
  setLicenceFile(artworkId: number, fileId: string, hash: string): Promise<void>
  /**
   * The batch for this form key, created unless it exists; `isNew` says which. A new one takes the
   * artworks named, with their order, author and source, in the same transaction.
   */
  startBatch(batch: NewBatch): Promise<{ batch: BatchRow; isNew: boolean }>
  /** The page's uploads not yet in a batch and not removed, in upload order. */
  unsentByForm(formKey: string): Promise<ArtworkRow[]>
  /** Every upload stored through a link since a moment: what the cap of sixty counts. */
  uploadsSince(linkId: number, since: Temporal.Instant): Promise<number>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toArtwork(row: Row): ArtworkRow {
  let position = row['position']
  let batchId = row['batch_id']
  return {
    articleId: Number(row['article_id']),
    author: text(row['author']),
    batchId: batchId === null || batchId === undefined ? null : Number(batchId),
    driveFileId: String(row['drive_file_id']),
    formKey: String(row['form_key']),
    id: Number(row['id']),
    isReadable: Number(row['is_readable']) === 1,
    licenceDocId: text(row['licence_doc_id']),
    licenceFileId: text(row['licence_file_id']),
    licenceHash: text(row['licence_hash']),
    linkId: Number(row['link_id']),
    mimeType: String(row['mime_type']),
    originalName: String(row['original_name']),
    position: position === null || position === undefined ? null : Number(position),
    removedAt: parseStamp(row['removed_at']),
    size: Number(row['size']),
    source: text(row['source']),
    storedName: String(row['stored_name']),
    uploadKey: String(row['upload_key']),
    uploadedAt: parseStamp(row['uploaded_at']) ?? EPOCH,
  }
}

function toBatch(row: Row, artworks: ArtworkRow[]): BatchRow {
  return {
    articleId: Number(row['article_id']),
    artworks,
    cleanupAt: parseStamp(row['cleanup_at']),
    createdAt: parseStamp(row['created_at']),
    discardedAt: parseStamp(row['discarded_at']),
    formKey: String(row['form_key']),
    id: Number(row['id']),
    issueId: Number(row['issue_id']),
    linkId: Number(row['link_id']),
    mailFailedAt: parseStamp(row['mail_failed_at']),
    mailRefusedAt: parseStamp(row['mail_refused_at']),
    mailSentAt: parseStamp(row['mail_sent_at']),
    providerEmail: String(row['provider_email']),
    providerName: String(row['provider_name']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
    tag: String(row['tag']),
  }
}

async function withArtworks(db: Database, rows: readonly Row[]): Promise<BatchRow[]> {
  if (rows.length === 0) return []
  let ids = rows.map((row) => Number(row['id']))
  let result = await db.exec(
    sql`SELECT * FROM artworks WHERE batch_id IN (SELECT value FROM json_each(${JSON.stringify(ids)}))
        ORDER BY batch_id, position`,
  )
  let byBatch = new Map<number, ArtworkRow[]>()
  for (let artwork of result.rows ?? []) {
    let id = Number(artwork['batch_id'])
    byBatch.set(id, [...(byBatch.get(id) ?? []), toArtwork(artwork)])
  }
  return rows.map((row) => toBatch(row, byBatch.get(Number(row['id'])) ?? []))
}

async function batchWhere(db: Database, row: Row | undefined): Promise<BatchRow | null> {
  if (row === undefined) return null
  let [batch] = await withArtworks(db, [row])
  return batch ?? null
}

async function batchByFormKey(db: Database, formKey: string): Promise<BatchRow | null> {
  let result = await db.exec(sql`SELECT * FROM artwork_batches WHERE form_key = ${formKey}`)
  return batchWhere(db, result.rows?.[0])
}

async function batchById(db: Database, id: number): Promise<BatchRow | null> {
  let result = await db.exec(sql`SELECT * FROM artwork_batches WHERE id = ${id}`)
  return batchWhere(db, result.rows?.[0])
}

/**
 * A tag the article has not used yet: the batch's start in Prague time, a second later for every
 * batch of the same article that already holds it, so the reply check never pairs two.
 */
async function freeTag(db: Database, articleId: number, at: Temporal.Instant): Promise<string> {
  let candidate = at
  for (;;) {
    let tag = batchTag(candidate)
    let taken = await db.exec(
      sql`SELECT 1 FROM artwork_batches WHERE article_id = ${articleId} AND tag = ${tag}`,
    )
    if ((taken.rows ?? []).length === 0) return tag
    candidate = candidate.add({ seconds: 1 })
  }
}

export function createArtworkStore(database: Database): ArtworkStore {
  return {
    async abandonedBatches() {
      let result = await database.exec(
        sql`SELECT * FROM artwork_batches WHERE created_at IS NULL ORDER BY id`,
      )
      return withArtworks(database, result.rows ?? [])
    },

    async addUpload(upload) {
      await database.exec(
        sql`INSERT INTO artworks (link_id, article_id, form_key, upload_key, drive_file_id,
              original_name, stored_name, mime_type, size, is_readable, uploaded_at)
            VALUES (${upload.linkId}, ${upload.articleId}, ${upload.formKey}, ${upload.uploadKey},
              ${upload.driveFileId}, ${upload.originalName}, ${upload.storedName}, ${upload.mimeType},
              ${upload.size}, ${upload.isReadable ? 1 : 0}, ${stamp(upload.at)})`,
      )
      let result = await database.exec(
        sql`SELECT * FROM artworks WHERE upload_key = ${upload.uploadKey}`,
      )
      let row = result.rows?.[0]
      if (row === undefined) throw new Error('The upload was not written.')
      return toArtwork(row)
    },

    commitBatch(id, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE artwork_batches SET created_at = ${stamp(at)}, cleanup_at = NULL
              WHERE id = ${id} AND created_at IS NULL`,
        )
        let batch = await batchById(db, id)
        if (batch === null || batch.createdAt === null)
          throw new Error('The batch was not written.')
        return batch
      })
    },

    async countsByArticle(issueId) {
      let result = await database.exec(
        sql`SELECT b.article_id, b.mail_sent_at, count(a.id) AS count
            FROM artwork_batches b JOIN artworks a ON a.batch_id = b.id
            WHERE b.issue_id = ${issueId} AND b.created_at IS NOT NULL AND b.discarded_at IS NULL
            GROUP BY b.id`,
      )
      let counts = new Map<number, ArtworkCounts>()
      for (let row of result.rows ?? []) {
        let articleId = Number(row['article_id'])
        let state: ArtworkState = batchState({
          mailRefusedAt: null,
          mailSentAt: parseStamp(row['mail_sent_at']),
        })
        let current = counts.get(articleId) ?? NO_ARTWORKS
        counts.set(articleId, { ...current, [state]: current[state] + Number(row['count']) })
      }
      return counts
    },

    async countsByIssue() {
      let result = await database.exec(
        sql`SELECT b.issue_id, count(a.id) AS total,
              sum(CASE WHEN b.mail_sent_at IS NULL THEN 1 ELSE 0 END) AS waiting
            FROM artwork_batches b JOIN artworks a ON a.batch_id = b.id
            WHERE b.created_at IS NOT NULL AND b.discarded_at IS NULL
            GROUP BY b.issue_id`,
      )
      let counts = new Map<number, { total: number; waiting: number }>()
      for (let row of result.rows ?? []) {
        counts.set(Number(row['issue_id']), {
          total: Number(row['total']),
          waiting: Number(row['waiting']),
        })
      }
      return counts
    },

    discardAttempt(id) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE artworks SET batch_id = NULL, position = NULL, author = NULL, source = NULL,
                licence_doc_id = NULL, licence_file_id = NULL, licence_hash = NULL
              WHERE batch_id = ${id}
                AND (SELECT created_at FROM artwork_batches WHERE id = ${id}) IS NULL`,
        )
        await db.exec(sql`DELETE FROM artwork_batches WHERE id = ${id} AND created_at IS NULL`)
      })
    },

    discardBatch(id, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE artwork_batches SET discarded_at = ${stamp(at)}
              WHERE id = ${id} AND created_at IS NOT NULL AND discarded_at IS NULL`,
        )
        await db.exec(
          sql`UPDATE artworks SET removed_at = ${stamp(at)}
              WHERE batch_id = ${id} AND removed_at IS NULL`,
        )
      })
    },

    async expiredUploads(before) {
      let result = await database.exec(
        sql`SELECT * FROM artworks
            WHERE batch_id IS NULL AND removed_at IS NULL AND uploaded_at < ${stamp(before)}
            ORDER BY id`,
      )
      return (result.rows ?? []).map(toArtwork)
    },

    findBatch(id) {
      return batchById(database, id)
    },

    findBatchByFormKey(formKey) {
      return batchByFormKey(database, formKey)
    },

    async findUpload(id) {
      let result = await database.exec(sql`SELECT * FROM artworks WHERE id = ${id}`)
      let row = result.rows?.[0]
      return row === undefined ? null : toArtwork(row)
    },

    async listByIssue(issueId) {
      let result = await database.exec(
        sql`SELECT b.*, ar.name AS article_name
            FROM artwork_batches b JOIN articles ar ON ar.id = b.article_id
            WHERE b.issue_id = ${issueId} AND b.created_at IS NOT NULL AND b.discarded_at IS NULL
            ORDER BY b.created_at DESC, b.id DESC`,
      )
      let rows = result.rows ?? []
      let batches = await withArtworks(database, rows)
      return batches.map((batch, index) => ({
        ...batch,
        articleName: String(rows[index]?.['article_name'] ?? ''),
        createdAt: batch.createdAt ?? EPOCH,
      }))
    },

    async markForCleanup(id, at) {
      await database.exec(
        sql`UPDATE artwork_batches SET cleanup_at = ${stamp(at)}
            WHERE id = ${id} AND created_at IS NULL`,
      )
    },

    async markMail(id, outcome, at) {
      if (outcome === 'sent') {
        await database.exec(
          sql`UPDATE artwork_batches SET mail_sent_at = ${stamp(at)}
              WHERE id = ${id} AND mail_sent_at IS NULL`,
        )
      } else if (outcome === 'refused') {
        await database.exec(
          sql`UPDATE artwork_batches SET mail_refused_at = ${stamp(at)}, mail_failed_at = ${stamp(at)}
              WHERE id = ${id} AND mail_sent_at IS NULL`,
        )
      } else {
        await database.exec(
          sql`UPDATE artwork_batches SET mail_failed_at = ${stamp(at)}
              WHERE id = ${id} AND mail_sent_at IS NULL`,
        )
      }
    },

    async markRemoved(id, at) {
      await database.exec(
        sql`UPDATE artworks SET removed_at = ${stamp(at)}
            WHERE id = ${id} AND batch_id IS NULL AND removed_at IS NULL`,
      )
    },

    async pendingCleanups() {
      let result = await database.exec(
        sql`SELECT * FROM artwork_batches
            WHERE created_at IS NULL AND cleanup_at IS NOT NULL ORDER BY id`,
      )
      return withArtworks(database, result.rows ?? [])
    },

    async recipientsSince(linkId, since) {
      let result = await database.exec(
        sql`SELECT DISTINCT lower(provider_email) AS email FROM artwork_batches
            WHERE link_id = ${linkId}
              AND (created_at >= ${stamp(since)} OR (created_at IS NULL AND started_at >= ${stamp(since)}))`,
      )
      return (result.rows ?? []).map((row) => String(row['email']))
    },

    async recentBatches(linkId, since) {
      let result = await database.exec(
        sql`SELECT count(*) AS count FROM artwork_batches
            WHERE link_id = ${linkId} AND started_at >= ${stamp(since)}`,
      )
      return Number(result.rows?.[0]?.['count'] ?? 0)
    },

    async setLicenceDoc(artworkId, docId) {
      await database.exec(
        sql`UPDATE artworks SET licence_doc_id = ${docId}
            WHERE id = ${artworkId} AND licence_doc_id IS NULL`,
      )
    },

    async setLicenceFile(artworkId, fileId, hash) {
      await database.exec(
        sql`UPDATE artworks SET licence_file_id = ${fileId}, licence_hash = ${hash}
            WHERE id = ${artworkId} AND licence_file_id IS NULL`,
      )
    },

    startBatch(batch) {
      return database.transaction(async (db) => {
        let existing = await batchByFormKey(db, batch.formKey)
        if (existing !== null) return { batch: existing, isNew: false }

        let tag = await freeTag(db, batch.articleId, batch.at)
        await db.exec(
          sql`INSERT INTO artwork_batches (issue_id, article_id, link_id, form_key, provider_name,
                provider_email, tag, started_at)
              VALUES (${batch.issueId}, ${batch.articleId}, ${batch.linkId}, ${batch.formKey},
                ${batch.provider.name}, ${batch.provider.email}, ${tag}, ${stamp(batch.at)})`,
        )
        let inserted = await batchByFormKey(db, batch.formKey)
        if (inserted === null) throw new Error('The batch was not written.')
        for (let [index, artwork] of batch.artworks.entries()) {
          await db.exec(
            sql`UPDATE artworks SET batch_id = ${inserted.id}, position = ${index + 1},
                  author = ${artwork.author === '' ? null : artwork.author},
                  source = ${artwork.source === '' ? null : artwork.source}
                WHERE id = ${artwork.id} AND form_key = ${batch.formKey}
                  AND batch_id IS NULL AND removed_at IS NULL AND is_readable = 1`,
          )
        }
        let row = await batchById(db, inserted.id)
        if (row === null || row.artworks.length !== batch.artworks.length) {
          throw new Error('An artwork of the batch is no longer on its page.')
        }
        return { batch: row, isNew: true }
      })
    },

    async unsentByForm(formKey) {
      let result = await database.exec(
        sql`SELECT * FROM artworks
            WHERE form_key = ${formKey} AND batch_id IS NULL AND removed_at IS NULL ORDER BY id`,
      )
      return (result.rows ?? []).map(toArtwork)
    },

    async uploadsSince(linkId, since) {
      let result = await database.exec(
        sql`SELECT count(*) AS count FROM artworks
            WHERE link_id = ${linkId} AND uploaded_at >= ${stamp(since)}`,
      )
      return Number(result.rows?.[0]?.['count'] ?? 0)
    },
  }
}
