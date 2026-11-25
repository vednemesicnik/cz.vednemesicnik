import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import type {
  ArtworkCounts,
  ArtworkState,
  BatchStatus,
  HolderKind,
  HolderName,
} from '../domain/artwork.ts'
import { batchState, batchTag, isWaiting, NO_ARTWORKS } from '../domain/artwork.ts'
import type { ApprovedCount } from '../domain/issue.ts'
import {
  type BatchReport,
  CLAIM_LIMIT,
  CLAIM_MINUTES,
  decideReport,
} from '../domain/reply-check.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { answeredAtOf, applyConsentPatch } from './consent-patch.server.ts'

/**
 * Artworks in the app's database, the source of truth for them, and the batches that send them.
 *
 * An upload is a row the moment Drive has stored its file, and belongs to the page that uploaded
 * it (its form key) until a batch takes it. A batch is written before Drive is asked for its
 * licences and keeps each licence's IDs the moment Drive returns them, so a failed one knows what
 * to put in the bin (`11c`). Only a committed batch is one; nothing else reads an attempt.
 */

export type ArtworkRow = {
  /** The article the upload belongs to, or `null` for a group's (`groupId`). */
  articleId: number | null
  author: string | null
  batchId: number | null
  driveFileId: string
  formKey: string
  groupId: number | null
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

export type BatchRow = BatchStatus & {
  /** The article the batch was sent to, or `null` for a group's (`groupId`). */
  articleId: number | null
  archiveError: string | null
  /** The batch's artworks in their order. */
  artworks: ArtworkRow[]
  checkedAt: Temporal.Instant | null
  claimedAt: Temporal.Instant | null
  claimKey: string | null
  cleanupAt: Temporal.Instant | null
  consentFileId: string | null
  consentVerifiedByEmail: string | null
  consentVerifiedByName: string | null
  createdAt: Temporal.Instant | null
  formKey: string
  groupId: number | null
  id: number
  issueId: number
  linkId: number
  mailFailedAt: Temporal.Instant | null
  providerEmail: string
  providerName: string
  replyReceivedAt: Temporal.Instant | null
  replyThreadId: string | null
  startedAt: Temporal.Instant
  tag: string
}

/**
 * The article or the group a listed batch belongs to: its name, and its folder and `Licence`, which
 * the Evidence names. The folders are `null` where a listing does not read them.
 */
export type ListedHolder = HolderName & {
  folderId: string | null
  /** The holder's ID under its own kind: an article's or a group's. */
  id: number
  licencesFolderId: string | null
}

/** A batch as the issue's detail lists it, with the article or the group it belongs to. */
export type ListedBatch = BatchRow & { createdAt: Temporal.Instant; holder: ListedHolder }

/** A batch handed to a run of the reply check, with what the archived PDF says and where it goes. */
export type ClaimedBatch = ListedBatch & {
  issueName: string
  /**
   * `null` when the article's or the group's `Licence` was found missing: the job then reports a
   * failed archive.
   */
  licencesFolderId: string | null
  /**
   * The name the batch's request was last sent under, which its subject carries; the holder's name
   * for a batch sent before the app kept it.
   */
  requestName: string
}

/** A card of _Ke kontrole_: a batch with the article and issue it belongs to. */
export type QueuedBatch = ListedBatch & { issueName: string }

export type ReportAnswer = 'accepted' | 'superseded' | 'unknown'

/** What an upload or a batch goes to: one article or one group, never both. */
export type HolderRef = { articleId: number; groupId?: null } | { articleId: null; groupId: number }

export type NewUpload = HolderRef & {
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

/**
 * A batch whose article was removed while its page was sending (`12z`). Thrown rather than
 * answered, as every other failure of `startBatch` is, because only the page's send meets it.
 */
export class HolderRemovedError extends Error {
  constructor() {
    super('The article of the batch was removed.')
    this.name = 'HolderRemovedError'
  }
}

export type NewBatch = HolderRef & {
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
  /**
   * Committed batches per issue: how many artworks, how many of them are _Schváleno_ (`01b`) and
   * how many wait on the editors.
   */
  countsByIssue(): Promise<Map<number, ApprovedCount & { waiting: number }>>
  /**
   * The artworks of the issue's committed batches per article, by their state (`12a`). A group's
   * batches are not here: the group's row counts them itself.
   */
  countsByArticle(issueId: number): Promise<Map<number, ArtworkCounts>>
  commitBatch(id: number, at: Temporal.Instant): Promise<BatchRow>
  /**
   * Removes a failed attempt whose licences are in the bin. Its artworks go back to their page,
   * unsent and without the fields the attempt gave them.
   */
  discardAttempt(id: number): Promise<void>
  /**
   * The editors discarded a committed batch: it stays as a record, its files are in the bin. Only
   * while it is neither approved nor has a consent recorded by _Je to souhlas_; otherwise it
   * answers which of them came meanwhile and writes nothing (`12o`).
   */
  discardBatch(
    id: number,
    at: Temporal.Instant,
  ): Promise<'approved' | 'discarded' | 'gone' | 'verified'>
  /**
   * How many of the article's batches are discarded, and whether a reply to one of them waits in
   * _Ke kontrole_: what the dialog of `12z` says before the app stops reading those replies.
   */
  discardedOf(articleId: number): Promise<{ count: number; isReplyWaiting: boolean }>
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
  /**
   * The name of the article or group the request is about to go under, before every sending: the
   * reply check looks for it in the subject after the holder is renamed (#152).
   */
  recordRequestName(id: number, name: string): Promise<void>
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
  /** Throws `HolderRemovedError` when the batch's article was removed after its link was read. */
  startBatch(batch: NewBatch): Promise<{ batch: BatchRow; isNew: boolean }>
  /** The page's uploads not yet in a batch and not removed, in upload order. */
  unsentByForm(formKey: string): Promise<ArtworkRow[]>
  /** Every upload stored through a link since a moment: what the cap of sixty counts. */
  uploadsSince(linkId: number, since: Temporal.Instant): Promise<number>

  /**
   * Takes the batches a run of the reply check asks about, under the run's key: committed, not
   * yet approved, in an issue that is not closed, _Chyba_ and discarded ones included (`01b`),
   * and not claimed by another run in the last `CLAIM_MINUTES`. The least recently checked first.
   * A batch of a removed article is never asked about: its reply stays in `publikace@` (`12z`).
   */
  claimForReplyCheck(runKey: string, at: Temporal.Instant): Promise<ClaimedBatch[]>
  /** What one report does to a batch the run claimed; `unknown` for one it did not. */
  recordReport(
    runKey: string,
    batchId: number,
    report: BatchReport,
    at: Temporal.Instant,
  ): Promise<ReportAnswer>
  /**
   * _Je to souhlas_ on the reply the card showed, `replyMessageId`; `false` when the batch is not
   * in _Ke kontrole_ any more, its issue was closed, or a newer reply arrived meanwhile.
   */
  verifyConsent(
    id: number,
    replyMessageId: string,
    editor: { displayName: string; email: string },
    at: Temporal.Instant,
  ): Promise<boolean>
  /**
   * _Vrátit_ until the job archives (`13b`); `false` once it has or failed to, or with nothing to
   * take back. Any editor-in-chief may, as any may decide.
   */
  undoVerification(id: number): Promise<boolean>
  /**
   * The cards of _Ke kontrole_, the oldest reply first, and the batch `including` names where it
   * stands, decided, approved or in a closed issue: the card just decided or answered keeps its
   * place until the next load (`13b`, `13e`).
   */
  reviewQueue(including?: number): Promise<QueuedBatch[]>
  /** How many cards _Ke kontrole_ has, for the panel. */
  reviewCount(): Promise<number>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function idOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}

/** The holder a listed row carries, from the `holder_*` columns its query selects. */
function holderOf(row: Row | undefined): ListedHolder {
  let kind: HolderKind = row?.['holder_kind'] === 'group' ? 'group' : 'article'
  return {
    folderId: text(row?.['holder_folder_id']),
    id: Number(kind === 'group' ? row?.['group_id'] : row?.['article_id']),
    kind,
    licencesFolderId: text(row?.['holder_licences_folder_id']),
    name: String(row?.['holder_name'] ?? ''),
  }
}

function toArtwork(row: Row): ArtworkRow {
  let position = row['position']
  let batchId = row['batch_id']
  return {
    articleId: idOrNull(row['article_id']),
    author: text(row['author']),
    batchId: batchId === null || batchId === undefined ? null : Number(batchId),
    driveFileId: String(row['drive_file_id']),
    formKey: String(row['form_key']),
    groupId: idOrNull(row['group_id']),
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
    answeredAt: answeredAtOf(row),
    approvedAt: parseStamp(row['approved_at']),
    archiveError: text(row['archive_error']),
    archiveFailedAt: parseStamp(row['archive_failed_at']),
    articleId: idOrNull(row['article_id']),
    artworks,
    checkedAt: parseStamp(row['checked_at']),
    claimedAt: parseStamp(row['claimed_at']),
    claimKey: text(row['claim_key']),
    cleanupAt: parseStamp(row['cleanup_at']),
    consentFileId: text(row['consent_file_id']),
    consentVerifiedAt: parseStamp(row['consent_verified_at']),
    consentVerifiedByEmail: text(row['consent_verified_by_email']),
    consentVerifiedByName: text(row['consent_verified_by_name']),
    createdAt: parseStamp(row['created_at']),
    discardedAt: parseStamp(row['discarded_at']),
    formKey: String(row['form_key']),
    groupId: idOrNull(row['group_id']),
    id: Number(row['id']),
    isExactConsent: Number(row['is_exact_consent']) === 1,
    issueId: Number(row['issue_id']),
    linkId: Number(row['link_id']),
    mailFailedAt: parseStamp(row['mail_failed_at']),
    mailRefusedAt: parseStamp(row['mail_refused_at']),
    mailSentAt: parseStamp(row['mail_sent_at']),
    providerEmail: String(row['provider_email']),
    providerName: String(row['provider_name']),
    replyMessageId: text(row['reply_message_id']),
    replyReceivedAt: parseStamp(row['reply_received_at']),
    replyText: text(row['reply_text']),
    replyThreadId: text(row['reply_thread_id']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
    tag: String(row['tag']),
  }
}

/**
 * The batches as `listByIssue` and the queue give them, with their article's or group's name and
 * their issue's. Every such query joins the batch's holder the same way:
 *
 *   LEFT JOIN articles ar ON ar.id = b.article_id LEFT JOIN artwork_groups g ON g.id = b.group_id
 *
 * and selects `coalesce(ar.name, g.name) AS holder_name` and `holder_kind`.
 */
async function listed(db: Database, rows: readonly Row[]): Promise<QueuedBatch[]> {
  let batches = await withArtworks(db, rows)
  return batches.map((batch, index) => ({
    ...batch,
    createdAt: batch.createdAt ?? EPOCH,
    holder: holderOf(rows[index]),
    issueName: String(rows[index]?.['issue_name'] ?? ''),
  }))
}

/**
 * What _Ke kontrole_ holds: a reply that waits on the editors-in-chief, and a consent whose
 * archive failed (`13c`). Chosen by `batchState`, so the queue, the panel and `12a` agree.
 */
function isQueued(batch: BatchRow): boolean {
  let state = batchState(batch)
  return state === 'review' || (state === 'error' && batch.archiveFailedAt !== null)
}

/*
 * The batches that could be in the queue; `isQueued` decides. The batch `including` names comes
 * whatever it is now, approved or in a closed issue: an answer that met either stays on its card
 * until the next load (`13e`).
 */
function queueCandidates(including: number | null) {
  return sql`SELECT b.*, coalesce(ar.name, g.name) AS holder_name,
      CASE WHEN b.group_id IS NULL THEN 'article' ELSE 'group' END AS holder_kind,
      i.name AS issue_name
    FROM artwork_batches b
    LEFT JOIN articles ar ON ar.id = b.article_id
    LEFT JOIN artwork_groups g ON g.id = b.group_id
    JOIN issues i ON i.id = b.issue_id
    WHERE b.created_at IS NOT NULL AND (ar.id IS NULL OR ar.removed_at IS NULL)
      AND (b.id = ${including} OR (
      b.approved_at IS NULL AND i.closed_at IS NULL
      AND (b.reply_message_id IS NOT NULL OR b.archive_failed_at IS NOT NULL)))
    ORDER BY coalesce(b.reply_received_at, b.archive_failed_at), b.id`
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
 * A tag the article or the group has not used yet: the batch's start in Prague time, a second
 * later for every batch of the same holder that already holds it, so the reply check never pairs
 * two.
 */
async function freeTag(db: Database, holder: HolderRef, at: Temporal.Instant): Promise<string> {
  let candidate = at
  for (;;) {
    let tag = batchTag(candidate)
    let taken = await db.exec(
      holder.groupId == null
        ? sql`SELECT 1 FROM artwork_batches WHERE article_id = ${holder.articleId} AND tag = ${tag}`
        : sql`SELECT 1 FROM artwork_batches WHERE group_id = ${holder.groupId} AND tag = ${tag}`,
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
        sql`INSERT INTO artworks (link_id, article_id, group_id, form_key, upload_key,
              drive_file_id, original_name, stored_name, mime_type, size, is_readable, uploaded_at)
            VALUES (${upload.linkId}, ${upload.articleId}, ${upload.groupId ?? null}, ${upload.formKey},
              ${upload.uploadKey},
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
        sql`SELECT b.*, count(a.id) AS count
            FROM artwork_batches b JOIN artworks a ON a.batch_id = b.id
            WHERE b.issue_id = ${issueId} AND b.created_at IS NOT NULL AND b.discarded_at IS NULL
            GROUP BY b.id`,
      )
      let counts = new Map<number, ArtworkCounts>()
      for (let row of result.rows ?? []) {
        if (row['article_id'] == null) continue
        let articleId = Number(row['article_id'])
        let state: ArtworkState = batchState(toBatch(row, []))
        let current = counts.get(articleId) ?? NO_ARTWORKS
        counts.set(articleId, { ...current, [state]: current[state] + Number(row['count']) })
      }
      return counts
    },

    async countsByIssue() {
      let result = await database.exec(
        sql`SELECT b.*, count(a.id) AS count
            FROM artwork_batches b JOIN artworks a ON a.batch_id = b.id
            WHERE b.created_at IS NOT NULL AND b.discarded_at IS NULL
            GROUP BY b.id`,
      )
      let counts = new Map<number, ApprovedCount & { waiting: number }>()
      for (let row of result.rows ?? []) {
        let issueId = Number(row['issue_id'])
        let count = Number(row['count'])
        let state = batchState(toBatch(row, []))
        let current = counts.get(issueId) ?? { approved: 0, total: 0, waiting: 0 }
        counts.set(issueId, {
          approved: current.approved + (state === 'approved' ? count : 0),
          total: current.total + count,
          waiting: current.waiting + (isWaiting(state) ? count : 0),
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
        let batch = await batchById(db, id)
        if (batch === null || batch.createdAt === null || batch.discardedAt !== null) return 'gone'
        if (batch.approvedAt !== null) return 'approved'
        if (batch.consentVerifiedAt !== null) return 'verified'
        await db.exec(sql`UPDATE artwork_batches SET discarded_at = ${stamp(at)} WHERE id = ${id}`)
        await db.exec(
          sql`UPDATE artworks SET removed_at = ${stamp(at)}
              WHERE batch_id = ${id} AND removed_at IS NULL`,
        )
        return 'discarded'
      })
    },

    async discardedOf(articleId) {
      let result = await database.exec(
        sql`SELECT * FROM artwork_batches
            WHERE article_id = ${articleId} AND created_at IS NOT NULL
              AND discarded_at IS NOT NULL`,
      )
      let batches = (result.rows ?? []).map((row) => toBatch(row, []))
      return { count: batches.length, isReplyWaiting: batches.some(isQueued) }
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
        sql`SELECT b.*, coalesce(ar.name, g.name) AS holder_name,
              CASE WHEN b.group_id IS NULL THEN 'article' ELSE 'group' END AS holder_kind,
              coalesce(ar.folder_id, g.folder_id) AS holder_folder_id,
              coalesce(ar.licences_folder_id, g.licences_folder_id) AS holder_licences_folder_id
            FROM artwork_batches b
            LEFT JOIN articles ar ON ar.id = b.article_id
            LEFT JOIN artwork_groups g ON g.id = b.group_id
            WHERE b.issue_id = ${issueId} AND b.created_at IS NOT NULL AND b.discarded_at IS NULL
            ORDER BY b.created_at DESC, b.id DESC`,
      )
      return listed(database, result.rows ?? [])
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

    async recordRequestName(id, name) {
      await database.exec(
        sql`UPDATE artwork_batches SET sent_holder_name = ${name} WHERE id = ${id}`,
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
        /* A removal of the article and this row are decided by the one write SQLite runs at a
           time: once the article is removed, no batch starts in its folder (`12z`). */
        if (batch.articleId !== null) {
          let article = await db.exec(
            sql`SELECT removed_at FROM articles WHERE id = ${batch.articleId}`,
          )
          if (article.rows?.[0]?.['removed_at'] != null) throw new HolderRemovedError()
        }

        let tag = await freeTag(db, batch, batch.at)
        await db.exec(
          sql`INSERT INTO artwork_batches (issue_id, article_id, group_id, link_id, form_key,
                provider_name, provider_email, tag, started_at)
              VALUES (${batch.issueId}, ${batch.articleId}, ${batch.groupId ?? null}, ${batch.linkId},
                ${batch.formKey},
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

    claimForReplyCheck(runKey, at) {
      let lease = stamp(at.subtract({ minutes: CLAIM_MINUTES }))
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`SELECT b.id FROM artwork_batches b JOIN issues i ON i.id = b.issue_id
              LEFT JOIN articles ar ON ar.id = b.article_id
              WHERE b.created_at IS NOT NULL AND b.approved_at IS NULL AND i.closed_at IS NULL
                AND (ar.id IS NULL OR ar.removed_at IS NULL)
                AND (b.claimed_at IS NULL OR b.claimed_at < ${lease})
              ORDER BY coalesce(b.checked_at, ''), b.id
              LIMIT ${CLAIM_LIMIT}`,
        )
        let ids = (result.rows ?? []).map((row) => Number(row['id']))
        if (ids.length === 0) return []
        let idList = JSON.stringify(ids)
        await db.exec(
          sql`UPDATE artwork_batches SET claim_key = ${runKey}, claimed_at = ${stamp(at)}
              WHERE id IN (SELECT value FROM json_each(${idList}))`,
        )
        let claimed = await db.exec(
          sql`SELECT b.*, coalesce(ar.name, g.name) AS holder_name,
                CASE WHEN b.group_id IS NULL THEN 'article' ELSE 'group' END AS holder_kind,
                i.name AS issue_name,
                coalesce(b.sent_holder_name, ar.name, g.name) AS request_name,
                CASE
                  WHEN b.group_id IS NULL AND ar.licences_folder_missing_at IS NULL
                    THEN ar.licences_folder_id
                  WHEN b.group_id IS NOT NULL AND g.licences_folder_missing_at IS NULL
                    THEN g.licences_folder_id
                END AS licences_folder_id
              FROM artwork_batches b
              LEFT JOIN articles ar ON ar.id = b.article_id
              LEFT JOIN artwork_groups g ON g.id = b.group_id
              JOIN issues i ON i.id = b.issue_id
              WHERE b.id IN (SELECT value FROM json_each(${idList}))
              ORDER BY coalesce(b.checked_at, ''), b.id`,
        )
        let rows = claimed.rows ?? []
        let batches = await listed(db, rows)
        return batches.map((batch, index) => ({
          ...batch,
          licencesFolderId: text(rows[index]?.['licences_folder_id']),
          requestName: String(rows[index]?.['request_name'] ?? batch.holder.name),
        }))
      })
    },

    recordReport(runKey, batchId, report, at) {
      return database.transaction(async (db) => {
        let batch = await batchById(db, batchId)
        if (batch === null || batch.claimKey !== runKey) return 'unknown'
        let decision = decideReport(batch, report, at)
        await applyConsentPatch(db, 'batches', batchId, decision.patch)
        /* Reported, so the next run may take it; the key stays for a repeat of this report. */
        await db.exec(sql`UPDATE artwork_batches SET claimed_at = NULL WHERE id = ${batchId}`)
        return decision.answer
      })
    },

    async verifyConsent(id, replyMessageId, editor, at) {
      return database.transaction(async (db) => {
        let batch = await batchById(db, id)
        if (batch === null || batch.createdAt === null || batchState(batch) !== 'review') {
          return false
        }
        /* The reply the editor read, not one that arrived after the page was drawn. */
        if (batch.replyMessageId !== replyMessageId) return false
        let issue = await db.exec(sql`SELECT closed_at FROM issues WHERE id = ${batch.issueId}`)
        if (issue.rows?.[0]?.['closed_at'] !== null) return false
        await db.exec(
          sql`UPDATE artwork_batches SET consent_verified_at = ${stamp(at)},
                consent_verified_by_email = ${editor.email},
                consent_verified_by_name = ${editor.displayName}
              WHERE id = ${id}`,
        )
        return true
      })
    },

    async undoVerification(id) {
      /* Only in the window `13b` gives it: once the archive failed, the decision stands (`13c`). */
      let result = await database.exec(
        sql`UPDATE artwork_batches SET consent_verified_at = NULL,
              consent_verified_by_email = NULL, consent_verified_by_name = NULL
            WHERE id = ${id} AND approved_at IS NULL AND archive_failed_at IS NULL
              AND consent_verified_at IS NOT NULL`,
      )
      return (result.affectedRows ?? 0) === 1
    },

    async reviewQueue(including) {
      let result = await database.exec(queueCandidates(including ?? null))
      let rows = (result.rows ?? []).filter(
        (row) => Number(row['id']) === including || isQueued(toBatch(row, [])),
      )
      return listed(database, rows)
    },

    async reviewCount() {
      let result = await database.exec(queueCandidates(null))
      return (result.rows ?? []).filter((row) => isQueued(toBatch(row, []))).length
    },
  }
}
