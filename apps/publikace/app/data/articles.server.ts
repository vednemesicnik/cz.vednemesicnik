import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import {
  CLAIM_LIMIT,
  CLAIM_MINUTES,
  clauseKey,
  type ClauseDetail,
  type ClauseOutcome,
  clauseState,
  type ClauseStatus,
  countClauses,
  sendKey,
  REPLY_CLAIM_LIMIT,
} from '../domain/approvals.ts'
import type { ArticleStep, Author, FinalVersion, ReplacedVersion } from '../domain/article.ts'
import type { ArticleFolderKind } from '../domain/article-folders.ts'
import { isReplaceable } from '../domain/final-version-replacement.ts'
import type { DigestCandidate } from '../domain/proofreading-digest.ts'
import { type BatchReport, decideReport } from '../domain/reply-check.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { applyConsentPatch } from './consent-patch.server.ts'
import { insertLink } from './links.server.ts'

/**
 * Articles in the app's database, the source of truth for them (`w4i6us5r`), and the attempts
 * that create them.
 *
 * An attempt is written before Drive is asked for anything and keeps each file's ID the moment
 * Drive returns it, so a failed one knows what to put in the bin (`11c`). Only a committed row is
 * an article; nothing else reads an attempt.
 */

export type ArticleAuthor = Author & {
  position: number
  welcomeFailedAt: Temporal.Instant | null
  welcomeSentAt: Temporal.Instant | null
}

export type DriveFileKind = 'artworks-folder' | 'doc' | 'folder' | 'licences-folder' | 'meta'

/** When the app found each of the article's three folders missing, `null` while it is not. */
export type MissingFolders = Readonly<Record<ArticleFolderKind, Temporal.Instant | null>>

export type ArticleRow = {
  artworksFolderId: string | null
  authors: ArticleAuthor[]
  cleanupAt: Temporal.Instant | null
  createdAt: Temporal.Instant | null
  docId: string | null
  folderId: string | null
  /** The final version that stands, `null` while there is none or it was cancelled (`15f`). */
  finalVersion: FinalVersion | null
  formKey: string
  /** The handover that stands, `null` while there is none or it was cancelled (`01a`). */
  handover: ArticleStep | null
  /**
   * The cancelled handover, kept so that _Vrátit_ restores it whole (`12l`): when it was made, and
   * when it was cancelled, which is what the restore must find unchanged.
   */
  cancelledHandover: { at: Temporal.Instant; cancelledAt: Temporal.Instant } | null
  id: number
  issueId: number
  licencesFolderId: string | null
  linkId: number
  metaFileId: string | null
  missing: MissingFolders
  name: string
  /** The take that stands, `null` while there is none or it was cancelled (`01a`). */
  proofreading: Proofreading | null
  /**
   * The cancelled take, kept so that _Vrátit_ gives it back whole (`15d`): who had it and since
   * when, and when it was cancelled, which is what the restore must find unchanged.
   */
  cancelledProofreading: (Proofreading & { cancelledAt: Temporal.Instant }) | null
  startedAt: Temporal.Instant
}

/** Who took the article on the page Korektura, and when (`01a`, `15d`). */
export type Proofreading = ArticleStep

/**
 * What a take, a cancellation or a restore came to. Only `done` wrote anything, and `at` is the
 * take's time (the cancellation's, for a cancel). Otherwise the article now stands as the outcome
 * says: taken by somebody (with who and since when), not taken, in a closed issue, or gone.
 * `isHandedOver` says where an article without a take stands: _Dopsáno_ or _Píše se_.
 */
export type ProofreadingOutcome =
  | { at: Temporal.Instant; isHandedOver: boolean; kind: 'done' }
  | { kind: 'proofreading'; step: ArticleStep }
  | { isHandedOver: boolean; kind: 'not-proofreading' }
  | { issueName: string; kind: 'closed' }
  | { kind: 'final-version'; step: ArticleStep }
  | { kind: 'gone' }

/**
 * What marking the final version came to (`15f`). Only `done` wrote anything. Otherwise the
 * article now stands as the outcome says: marked already (by whom and when), taken by somebody
 * else or under another take than the card showed, no longer taken, in a closed issue, or gone.
 */
export type FinalVersionOutcome =
  | { at: Temporal.Instant; kind: 'done' }
  | { kind: 'final-version'; step: ArticleStep }
  | { kind: 'proofreading'; step: ArticleStep }
  | { isHandedOver: boolean; kind: 'not-proofreading' }
  | { issueName: string; kind: 'closed' }
  | { kind: 'gone' }

/**
 * What cancelling the final version came to (`15g`). `done` gives the PDF's ID, for the bin, and
 * the time of the marking that stands again when the cancelled one had replaced it (`12s`).
 * `too-late` is a marking whose clause a run of the job has taken; `not-final` one that is no
 * longer the marking the card showed, or never was.
 */
export type CancelFinalOutcome =
  | { kind: 'done'; pdfFileId: string; restored: Temporal.Instant | null }
  | { kind: 'not-final' }
  | { kind: 'too-late' }
  | { issueName: string; kind: 'closed' }
  | { kind: 'gone' }

/**
 * What marking a new version in place of the standing one came to (`12r`, `12s`). Only `done`
 * wrote anything. Otherwise the article now stands as the outcome says: another marking than the
 * row showed stands (`replaced`, with it), none stands (`not-final`), every author agreed
 * meanwhile, the issue was closed, or the article is gone or its marking may still be cancelled.
 */
export type ReplaceFinalOutcome =
  | { at: Temporal.Instant; kind: 'done' }
  | { kind: 'replaced'; step: ArticleStep }
  | { kind: 'not-final' }
  | { kind: 'all-approved' }
  | { issueName: string; kind: 'closed' }
  | { kind: 'gone' }

/** A clause a run of `Article_Approvals` took to send: what its e-mail needs (#89). */
export type ClaimedClause = {
  articleName: string
  authorEmail: string
  authorName: string
  clauseKey: string
  docId: string
  issueName: string
  pdfFileId: string
  /** The PDF's sha256, which names the attachment as the old job names it. */
  pdfHash: string
  /**
   * The clause replaces the same author's clause of an earlier marking that a run once took, so an
   * e-mail may have reached the author, and this one says it replaces it (`20f`, #90).
   */
  replacesEarlier: boolean
  /** The Mailer's key for this sending, a new one after _Poslat žádost znovu_ (`sendKey`). */
  sendKey: string
  signature: string
}

/**
 * What _Poslat žádost znovu_ came to (`12b`). `done` gives how many clauses went back to
 * _K odeslání_; `nothing` is a row whose clauses all changed meanwhile, or a marking that is no
 * longer the one it showed.
 */
export type ResendClausesOutcome =
  | { count: number; kind: 'done' }
  | { kind: 'nothing' }
  | { issueName: string; kind: 'closed' }
  | { kind: 'gone' }

/** A clause a run took to ask about its reply, and where its archive goes (#89). */
export type ClaimedReply = {
  articleName: string
  authorEmail: string
  authorName: string
  clauseKey: string
  /** A person decided the reply is a consent (_Je to souhlas_), so any reply is archived. */
  isVerified: boolean
  issueName: string
  /** `null` when the article's `Licence` was found missing: the job then reports a failed archive. */
  licencesFolderId: string | null
}

/** One author's clause as _Ke kontrole_ shows it (`13a`–`13c`). */
export type QueuedClause = ClauseStatus & {
  archiveError: string | null
  articleId: number
  articleName: string
  authorEmail: string
  authorName: string
  consentVerifiedByName: string | null
  id: number
  issueName: string
  replyReceivedAt: Temporal.Instant | null
  replyText: string | null
}

export type ReplyAnswer = 'accepted' | 'superseded' | 'unknown'

/** The PDF a marking stored, and the tag it carries on Drive. */
export type FinalVersionPdf = { attemptKey: string; fileId: string; hash: string }

/** An article on the page Korektura (`15a`): only what a proofreader needs for the work. */
export type QueueArticle = {
  authors: readonly string[]
  /** The cancelled take, which keeps a card just cancelled where its take put it (`15d`). */
  cancelledProofreading: Proofreading | null
  createdAt: Temporal.Instant
  docId: string
  finalVersion: FinalVersion | null
  handover: ArticleStep | null
  id: number
  issueName: string
  name: string
  proofreading: Proofreading | null
}

/**
 * What a handover, a cancellation or a restore came to. Anything but `done` wrote nothing: the
 * article was meanwhile handed over (with that handover), taken by a proofreader (with who and
 * since when), or has no handover to cancel or restore.
 */
export type HandoverOutcome =
  | { at: Temporal.Instant; kind: 'done' }
  | { kind: 'handed-over'; step: ArticleStep }
  | { kind: 'not-handed-over' }
  | { kind: 'proofreading'; step: ArticleStep }
  | { kind: 'gone' }

/** What a confirmed digest told, each with the time it carried, so a change since survives. */
export type { DigestCandidate }

export type AnnouncedDigest = {
  cancelled: readonly { handedOverAt: Temporal.Instant; id: number }[]
  handedOver: readonly { handedOverAt: Temporal.Instant; id: number }[]
}

/** A committed article: its files exist. */
export type Article = ArticleRow & { createdAt: Temporal.Instant; docId: string; folderId: string }

export type NewAttempt = {
  at: Temporal.Instant
  authors: readonly Author[]
  formKey: string
  issueId: number
  linkId: number
  name: string
}

export type ArticleStore = {
  /** Every attempt left uncommitted, for the cleanup at startup, when no request is running. */
  abandonedAttempts(): Promise<ArticleRow[]>
  /** Commits the attempt as an article and gives it its link for artworks, in one transaction. */
  commit(id: number, at: Temporal.Instant): Promise<Article>
  /** Created articles per issue, for the overview's counts. */
  countsByIssue(): Promise<Map<number, number>>
  /** Removes an attempt whose files are in the bin; its authors go with it. */
  discard(id: number): Promise<void>
  findByFormKey(formKey: string): Promise<ArticleRow | null>
  findById(id: number): Promise<ArticleRow | null>
  /**
   * A created article for a link from the morning digest (`15e`): its name and its issue, open or
   * closed, so that the page can say why the article is not on it. Only one that was handed over,
   * as only those were ever in a digest: an ID tried by hand learns nothing of the closed issues.
   */
  findForQueue(id: number): Promise<{
    hasFinalVersion: boolean
    isIssueClosed: boolean
    issueName: string
    name: string
  } | null>
  /**
   * Hands the article over to proofreading (`12k`), unless it was handed over meanwhile or a
   * proofreader took it. A cancelled handover is replaced by this one.
   */
  handOver(
    id: number,
    by: { email: string; name: string | null },
    at: Temporal.Instant,
  ): Promise<HandoverOutcome>
  /**
   * Cancels the standing handover (`12k`). With `handedOverAt`, only that very handover: _Vrátit_
   * after a handover must not cancel one somebody made since.
   */
  cancelHandover(
    id: number,
    at: Temporal.Instant,
    handedOverAt?: Temporal.Instant,
  ): Promise<HandoverOutcome>
  /**
   * _Vrátit_ after a cancellation (`12l`): the cancelled handover stands again, with its own time
   * and its own place in the digest, if it is still the one cancelled at `cancelledAt`.
   */
  restoreHandover(id: number, cancelledAt: Temporal.Instant): Promise<HandoverOutcome>
  /** Every article the morning digest may speak of, the oldest handover first (`12n`). */
  listForDigest(): Promise<DigestCandidate[]>
  /** Every created article of every open issue, for the page Korektura (`15a`). */
  listForQueue(): Promise<QueueArticle[]>
  /** The articles in _Dopsáno_ of open issues: the number beside _Korektura_ in the panel. */
  queueCount(): Promise<number>
  /** Records what a digest the Mailer confirmed told, where nothing changed since. */
  markAnnounced(digest: AnnouncedDigest, at: Temporal.Instant): Promise<void>
  /** The issue's created articles, newest first. */
  listCreated(issueId: number): Promise<Article[]>
  /** The folders the app reached again: their records go. */
  clearMissing(id: number, kinds: readonly ArticleFolderKind[]): Promise<void>
  /** An attempt whose cleanup did not get through, to be tried again. */
  markForCleanup(id: number, at: Temporal.Instant): Promise<void>
  /** The folders the app found missing; one already recorded keeps the time it was found. */
  markMissing(id: number, kinds: readonly ArticleFolderKind[], at: Temporal.Instant): Promise<void>
  /**
   * _Vzít si korekturu_ (`15d`), while nobody has the article and its issue is open. A cancelled
   * take is replaced. `shown` is the state the card showed: taken from _Dopsáno_, it writes only
   * while the handover stands, because the proofreader chose a handed-over text. Taken from
   * _Píše se_, a handover made meanwhile does not stop it: they wanted the text either way.
   */
  takeProofreading(
    id: number,
    by: { email: string; name: string | null },
    at: Temporal.Instant,
    shown: 'handedOver' | 'writing',
  ): Promise<ProofreadingOutcome>
  /**
   * _Zrušit korekturu_ (`15d`). With `proofreadAt`, only that very take: _Vrátit_ after a take
   * must not cancel one somebody made since. With `owner`, only a take of that account: a
   * proofreader cancels their own, an editor-in-chief passes none.
   */
  cancelProofreading(
    id: number,
    at: Temporal.Instant,
    options?: { owner?: string; proofreadAt?: Temporal.Instant },
  ): Promise<ProofreadingOutcome>
  /**
   * _Vrátit_ after a cancellation (`15d`): the cancelled take stands again, with whoever had it
   * and its own time, if it is still the one cancelled at `cancelledAt` and nobody took the
   * article since. With `owner`, only a take of that account.
   */
  restoreProofreading(
    id: number,
    cancelledAt: Temporal.Instant,
    options?: { owner?: string },
  ): Promise<ProofreadingOutcome>
  /**
   * Whether _Označit finální verzi_ may go ahead (`15f`), read before Drive is asked to store
   * anything: `null` when it may, else what stands in the way. `takenAt` is the take the card
   * showed; `owner` limits it to that account's take, and an editor-in-chief passes none.
   */
  checkFinalVersion(
    id: number,
    takenAt: Temporal.Instant,
    owner?: string,
  ): Promise<Exclude<FinalVersionOutcome, { kind: 'done' }> | null>
  /**
   * Records the final version and one clause _K odeslání_ per author, in one transaction, with
   * the same checks as `checkFinalVersion` made again: anything else wrote nothing, and the PDF
   * is the caller's to put in the bin.
   */
  markFinalVersion(input: {
    at: Temporal.Instant
    by: { email: string; name: string | null }
    id: number
    owner?: string
    pdf: FinalVersionPdf
    takenAt: Temporal.Instant
  }): Promise<FinalVersionOutcome>
  /**
   * _Zrušit finální verzi_ of the marking made at `markedAt`, while no run has taken a clause:
   * its clauses go, the article is _Korektura_ of the same take again.
   */
  cancelFinalVersion(
    id: number,
    at: Temporal.Instant,
    markedAt: Temporal.Instant,
    owner?: string,
  ): Promise<CancelFinalOutcome>
  /**
   * Whether a new version may be marked in place of the one marked at `markedAt` (`12r`), read
   * before Drive is asked to store anything: `null` when it may, else what stands in the way.
   */
  checkReplaceFinalVersion(
    id: number,
    markedAt: Temporal.Instant,
  ): Promise<Exclude<ReplaceFinalOutcome, { kind: 'done' }> | null>
  /**
   * Records the new version and one clause _K odeslání_ per author in place of the marking made at
   * `markedAt`, which stops standing, in one transaction and with the same checks made again.
   * Anything else wrote nothing, and the PDF is the caller's to put in the bin.
   */
  replaceFinalVersion(input: {
    at: Temporal.Instant
    by: { email: string; name: string | null }
    id: number
    markedAt: Temporal.Instant
    pdf: FinalVersionPdf
  }): Promise<ReplaceFinalOutcome>
  /** The article's replaced markings, the newest first, each with its clauses (`12s`). */
  replacedVersions(id: number): Promise<ReplacedVersion[]>
  /**
   * The marking that stands in place of the one this clause belongs to, once that one was
   * replaced, for the toast of `13a`; `null` while the clause's own marking stands.
   */
  replacingVersionOf(clauseId: number): Promise<ArticleStep | null>
  /**
   * The clauses _K odeslání_ of standing markings in open issues, for one run of the job: each
   * taken under `runKey` and not handed to another run for `CLAIM_MINUTES`. Taking one ends the
   * marking's way back for good.
   */
  claimForSending(runKey: string, at: Temporal.Instant): Promise<ClaimedClause[]>
  /**
   * _Poslat žádost znovu_ on the marking made at `markedAt` (`12b`): every clause of it the Mailer
   * did not confirm, or sent with no reply since, goes back to _K odeslání_ for the next run, under
   * a new attempt. `first_claimed_at` stays, so the marking stays past its way back.
   */
  resendClauses(id: number, markedAt: Temporal.Instant): Promise<ResendClausesOutcome>
  /** What the run did with a clause it claimed; `unknown` for one it did not claim. */
  recordSending(
    runKey: string,
    key: string,
    outcome: ClauseOutcome,
    at: Temporal.Instant,
  ): Promise<'done' | 'unknown'>
  /**
   * The clauses whose reply a run asks about, under the run's key: sent, or not confirmed by the
   * Mailer (a copy may have arrived after all), not yet approved, of a standing marking in an
   * open issue, and not claimed by another run in the last `CLAIM_MINUTES`. The least recently
   * checked first.
   */
  claimForReplies(runKey: string, at: Temporal.Instant): Promise<ClaimedReply[]>
  /** What one report of a reply does to a clause the run claimed; `unknown` for one it did not. */
  recordReply(
    runKey: string,
    key: string,
    report: BatchReport,
    at: Temporal.Instant,
  ): Promise<ReplyAnswer>
  /**
   * _Je to souhlas_ on the reply the card showed, `replyMessageId`; `false` when the clause is not
   * in _Ke kontrole_ any more, its issue was closed, or a newer reply arrived meanwhile.
   */
  verifyClause(
    id: number,
    replyMessageId: string,
    editor: { displayName: string; email: string },
    at: Temporal.Instant,
  ): Promise<boolean>
  /** _Vrátit_ until the job archives (`13b`); `false` once it has or failed to, or with nothing to take back. */
  undoClauseVerification(id: number): Promise<boolean>
  /**
   * The clauses of _Ke kontrole_, the oldest reply first, and the clause `including` names where
   * it stands, decided or not: the card just decided keeps its place until the next load (`13b`).
   */
  reviewQueue(including?: number): Promise<QueuedClause[]>
  /** How many cards of articles _Ke kontrole_ has, for the panel. */
  reviewCount(): Promise<number>
  markWelcome(
    articleId: number,
    position: number,
    outcome: 'failed' | 'sent',
    at: Temporal.Instant,
  ): Promise<void>
  /**
   * Created articles with a missing folder, or with a clause that waits on the editors-in-chief
   * (_Chyba_, _Ke kontrole_), per issue: each is one item of _Čeká na vás_ (`11a`, `01d`).
   */
  missingCountsByIssue(): Promise<Map<number, number>>
  /** Attempts whose cleanup failed, safe to take while other requests run. */
  pendingCleanups(): Promise<ArticleRow[]>
  /**
   * Attempts through a link since a moment, under way or committed: what the limit counts. A
   * failed one is discarded and no longer counts, as it sent nothing.
   */
  recentAttempts(linkId: number, since: Temporal.Instant): Promise<number>
  /** Stores a file's ID once; one already stored is never replaced. */
  setDriveId(id: number, kind: DriveFileKind, fileId: string): Promise<void>
  /** The attempt for this form key, created unless it exists; `isNew` says which. */
  startAttempt(attempt: NewAttempt): Promise<{ attempt: ArticleRow; isNew: boolean }>
}

type Row = Record<string, unknown>

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function toAuthor(row: Row): ArticleAuthor {
  return {
    email: String(row['email']),
    name: String(row['name']),
    position: Number(row['position']),
    welcomeFailedAt: parseStamp(row['welcome_failed_at']),
    welcomeSentAt: parseStamp(row['welcome_sent_at']),
  }
}

function toRow(
  row: Row,
  authors: ArticleAuthor[],
  finalVersion: FinalVersion | null = null,
): ArticleRow {
  return {
    finalVersion,
    artworksFolderId: text(row['artworks_folder_id']),
    authors,
    cleanupAt: parseStamp(row['cleanup_at']),
    createdAt: parseStamp(row['created_at']),
    docId: text(row['doc_id']),
    folderId: text(row['folder_id']),
    formKey: String(row['form_key']),
    handover: toHandover(row, false),
    cancelledHandover: toCancelledHandover(row),
    id: Number(row['id']),
    issueId: Number(row['issue_id']),
    licencesFolderId: text(row['licences_folder_id']),
    linkId: Number(row['link_id']),
    metaFileId: text(row['meta_file_id']),
    missing: {
      article: parseStamp(row['folder_missing_at']),
      artworks: parseStamp(row['artworks_folder_missing_at']),
      licences: parseStamp(row['licences_folder_missing_at']),
    },
    name: String(row['name']),
    proofreading: toProofreading(row, false),
    cancelledProofreading: toCancelledProofreading(row),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
  }
}

function toProofreading(row: Row, isCancelled: boolean): Proofreading | null {
  let at = parseStamp(row['proofread_at'])
  let email = text(row['proofread_by_email'])
  if (at === null || email === null) return null
  if ((parseStamp(row['proofreading_cancelled_at']) !== null) !== isCancelled) return null
  return { at, email, name: text(row['proofread_by_name']) }
}

function toCancelledProofreading(row: Row): ArticleRow['cancelledProofreading'] {
  let take = toProofreading(row, true)
  let cancelledAt = parseStamp(row['proofreading_cancelled_at'])
  return take === null || cancelledAt === null ? null : { ...take, cancelledAt }
}

function toHandover(row: Row, isCancelled: boolean): ArticleStep | null {
  let at = parseStamp(row['handed_over_at'])
  let email = text(row['handed_over_by_email'])
  if (at === null || email === null) return null
  if ((parseStamp(row['handover_cancelled_at']) !== null) !== isCancelled) return null
  return { at, email, name: text(row['handed_over_by_name']) }
}

function toCancelledHandover(row: Row): ArticleRow['cancelledHandover'] {
  let handover = toHandover(row, true)
  let cancelledAt = parseStamp(row['handover_cancelled_at'])
  return handover === null || cancelledAt === null ? null : { at: handover.at, cancelledAt }
}

/** Why a step on the handover wrote nothing, read from the article as it now is. */
function refusalOf(row: ArticleRow | null): HandoverOutcome {
  if (row === null || row.createdAt === null) return { kind: 'gone' }
  if (row.proofreading !== null) return { kind: 'proofreading', step: row.proofreading }
  if (row.handover !== null) return { kind: 'handed-over', step: row.handover }
  return { kind: 'not-handed-over' }
}

/** Where a step on the take left the article, read from it as it now is, its issue included. */
async function proofreadingRefusalOf(db: Database, id: number): Promise<ProofreadingOutcome> {
  let row = await byId(db, id)
  if (row === null || row.createdAt === null) return { kind: 'gone' }
  let issue = await db.exec(sql`SELECT name, closed_at FROM issues WHERE id = ${row.issueId}`)
  let issueRow = issue.rows?.[0]
  if (issueRow === undefined) return { kind: 'gone' }
  if (issueRow['closed_at'] !== null) return { issueName: String(issueRow['name']), kind: 'closed' }
  if (row.finalVersion !== null) return { kind: 'final-version', step: row.finalVersion }
  if (row.proofreading !== null) return { kind: 'proofreading', step: row.proofreading }
  return { isHandedOver: row.handover !== null, kind: 'not-proofreading' }
}

/** The article and the name of its issue, open or closed; `null` for one not created. */
async function withIssue(
  db: Database,
  id: number,
): Promise<{ issueName: string; isClosed: boolean; row: ArticleRow } | null> {
  let row = await byId(db, id)
  if (row === null || row.createdAt === null) return null
  let issue = await db.exec(sql`SELECT name, closed_at FROM issues WHERE id = ${row.issueId}`)
  let issueRow = issue.rows?.[0]
  if (issueRow === undefined) return null
  return { isClosed: issueRow['closed_at'] !== null, issueName: String(issueRow['name']), row }
}

/** What stands in the way of marking the take shown at `takenAt`, or `null`. */
async function finalVersionRefusalOf(
  db: Database,
  id: number,
  takenAt: Temporal.Instant,
  owner: string | undefined,
): Promise<Exclude<FinalVersionOutcome, { kind: 'done' }> | null> {
  let found = await withIssue(db, id)
  if (found === null) return { kind: 'gone' }
  let { isClosed, issueName, row } = found
  if (isClosed) return { issueName, kind: 'closed' }
  if (row.finalVersion !== null) return { kind: 'final-version', step: row.finalVersion }
  if (row.proofreading === null) {
    return { isHandedOver: row.handover !== null, kind: 'not-proofreading' }
  }
  /* Another take than the card showed, or the take of somebody else: the step was decided over
     a card that is no longer true (`15g`). */
  let isOtherTake = !row.proofreading.at.equals(takenAt)
  let isOtherOwner = owner !== undefined && row.proofreading.email !== owner
  if (isOtherTake || isOtherOwner) return { kind: 'proofreading', step: row.proofreading }
  return null
}

/** What stands in the way of cancelling the marking made at `markedAt`, or `null`. */
async function cancelFinalRefusalOf(
  db: Database,
  id: number,
  markedAt: Temporal.Instant,
  owner: string | undefined,
): Promise<Exclude<CancelFinalOutcome, { kind: 'done' }> | null> {
  let found = await withIssue(db, id)
  if (found === null) return { kind: 'gone' }
  let { isClosed, issueName, row } = found
  if (isClosed) return { issueName, kind: 'closed' }
  let finalVersion = row.finalVersion
  if (finalVersion === null || !finalVersion.at.equals(markedAt)) return { kind: 'not-final' }
  if (owner !== undefined && row.proofreading?.email !== owner) return { kind: 'not-final' }
  /* A new version is the editors-in-chief's step: a proofreader never cancels one (`12s`). */
  if (owner !== undefined && finalVersion.isReplacement) return { kind: 'not-final' }
  if (!finalVersion.isCancellable) return { kind: 'too-late' }
  return null
}

/** What stands in the way of marking a new version in place of the one made at `markedAt`. */
async function replaceFinalRefusalOf(
  db: Database,
  id: number,
  markedAt: Temporal.Instant,
): Promise<Exclude<ReplaceFinalOutcome, { kind: 'done' }> | null> {
  let found = await withIssue(db, id)
  if (found === null) return { kind: 'gone' }
  let { isClosed, issueName, row } = found
  if (isClosed) return { issueName, kind: 'closed' }
  let finalVersion = row.finalVersion
  if (finalVersion === null) return { kind: 'not-final' }
  if (!finalVersion.at.equals(markedAt)) return { kind: 'replaced', step: finalVersion }
  /* Every author agreed meanwhile: a change now is _Upraveno po schválení_ (`12s`). */
  if (finalVersion.clauses.approved === finalVersion.clauses.total) return { kind: 'all-approved' }
  /* Not offered before a run takes a clause, where cancelling is the way: a crafted request. */
  if (!isReplaceable(finalVersion)) return { kind: 'gone' }
  return null
}

/** Nobody has the article: never taken, or the take was cancelled. */
const NO_TAKE = sql`(proofread_at IS NULL OR proofreading_cancelled_at IS NOT NULL)`

/** The article belongs to an issue that is still open. */
const IN_OPEN_ISSUE = sql`issue_id IN (SELECT id FROM issues WHERE closed_at IS NULL)`

/**
 * A marking that stands: neither cancelled nor replaced by a newer one (`15g`, `12s`). `STANDING`
 * for `final_versions` alone, `STANDING_F` where it is joined as `f`.
 */
const STANDING = sql`cancelled_at IS NULL AND replaced_at IS NULL`
const STANDING_F = sql`f.cancelled_at IS NULL AND f.replaced_at IS NULL`

function asArticle(row: ArticleRow): Article {
  if (row.createdAt === null || row.docId === null || row.folderId === null) {
    throw new Error('An attempt was read as an article.')
  }
  return { ...row, createdAt: row.createdAt, docId: row.docId, folderId: row.folderId }
}

async function withAuthors(db: Database, rows: readonly Row[]): Promise<ArticleRow[]> {
  if (rows.length === 0) return []
  let ids = rows.map((row) => Number(row['id']))
  let result = await db.exec(
    sql`SELECT * FROM article_authors WHERE article_id IN (SELECT value FROM json_each(${JSON.stringify(ids)}))
        ORDER BY article_id, position`,
  )
  let byArticle = new Map<number, ArticleAuthor[]>()
  for (let author of result.rows ?? []) {
    let id = Number(author['article_id'])
    byArticle.set(id, [...(byArticle.get(id) ?? []), toAuthor(author)])
  }
  let finalVersions = await standingFinalVersions(db, ids)
  return rows.map((row) => {
    let id = Number(row['id'])
    return toRow(row, byArticle.get(id) ?? [], finalVersions.get(id) ?? null)
  })
}

/** What `clauseState` reads of a clause's row. */
function toClauseStatus(row: Row): ClauseStatus {
  let state = String(row['state'])
  return {
    approvedAt: parseStamp(row['approved_at']),
    archiveFailedAt: parseStamp(row['archive_failed_at']),
    consentVerifiedAt: parseStamp(row['consent_verified_at']),
    isExactConsent: Number(row['is_exact_consent']) === 1,
    replyMessageId: text(row['reply_message_id']),
    state: state === 'failed' || state === 'sent' ? state : 'pending',
  }
}

/** One clause as the open row of the issue detail reads it (`12b`). */
function toClauseDetail(row: Row): ClauseDetail {
  return {
    approvedAt: parseStamp(row['approved_at']),
    archiveError: text(row['archive_error']),
    authorEmail: String(row['author_email']),
    authorName: String(row['author_name']),
    error: text(row['error']),
    id: Number(row['id']),
    replyReceivedAt: parseStamp(row['reply_received_at']),
    replyText: text(row['reply_text']),
    sentAt: parseStamp(row['sent_at']),
    signature: String(row['signature']),
    state: clauseState(toClauseStatus(row)),
  }
}

/**
 * The standing marking of each article, with its clauses counted by state. The states come from
 * `clauseState`, so the tag, the queue and the counts read a clause the same way.
 */
async function standingFinalVersions(
  db: Database,
  ids: readonly number[],
): Promise<Map<number, FinalVersion>> {
  let versions = await db.exec(
    sql`SELECT id, article_id, marked_at, marked_by_email, marked_by_name, pdf_file_id,
          replaces_version_id
        FROM final_versions
        WHERE ${STANDING}
          AND article_id IN (SELECT value FROM json_each(${JSON.stringify(ids)}))`,
  )
  let versionIds = (versions.rows ?? []).map((row) => Number(row['id']))
  let clauses = await db.exec(
    sql`SELECT * FROM article_clauses
        WHERE final_version_id IN (SELECT value FROM json_each(${JSON.stringify(versionIds)}))
        ORDER BY coalesce(reply_received_at, ''), position`,
  )
  let byVersion = new Map<number, Row[]>()
  for (let row of clauses.rows ?? []) {
    let id = Number(row['final_version_id'])
    byVersion.set(id, [...(byVersion.get(id) ?? []), row])
  }
  let byArticle = new Map<number, FinalVersion>()
  for (let row of versions.rows ?? []) {
    let rows = byVersion.get(Number(row['id'])) ?? []
    let reviewed = rows.find((clause) => clauseState(toClauseStatus(clause)) === 'review')
    byArticle.set(Number(row['article_id']), {
      at: parseStamp(row['marked_at']) ?? EPOCH,
      authors: rows
        .toSorted((a, b) => Number(a['position']) - Number(b['position']))
        .map(toClauseDetail),
      clauses: countClauses(rows.map(toClauseStatus)),
      email: String(row['marked_by_email']),
      isCancellable: !rows.some((clause) => clause['first_claimed_at'] !== null),
      isReplacement: row['replaces_version_id'] !== null,
      name: text(row['marked_by_name']),
      pdfFileId: String(row['pdf_file_id']),
      reviewAuthor: reviewed === undefined ? null : String(reviewed['author_name']),
    })
  }
  return byArticle
}

/**
 * The clauses that wait on the editors-in-chief, as `clauseState` reads them: an e-mail the Mailer
 * did not confirm with no reply since (`unsent`), a reply in _Ke kontrole_ (`review`) and a
 * failed archive (`unarchived`). Written out for SQL; the tests hold it to `clauseState`.
 */
const WAITS_ON_EDITORS = sql`c.approved_at IS NULL AND c.state != 'pending' AND (
    c.archive_failed_at IS NOT NULL
    OR (c.reply_message_id IS NULL AND c.state = 'failed')
    OR (c.reply_message_id IS NOT NULL AND c.consent_verified_at IS NULL
        AND c.is_exact_consent = 0)
  )`

/* The clauses that could be in the queue; `isQueuedClause` decides. */
const CLAUSE_QUEUE_CANDIDATES = sql`SELECT c.*, a.name AS article_name, i.name AS issue_name
  FROM article_clauses c
  JOIN final_versions f ON f.id = c.final_version_id
  JOIN articles a ON a.id = c.article_id
  JOIN issues i ON i.id = a.issue_id
  WHERE ${STANDING_F} AND i.closed_at IS NULL AND c.approved_at IS NULL
    AND (c.reply_message_id IS NOT NULL OR c.archive_failed_at IS NOT NULL)
  ORDER BY coalesce(c.reply_received_at, c.archive_failed_at), c.id`

/** What _Ke kontrole_ holds of articles: a reply that waits on a person, and a failed archive. */
function isQueuedClause(row: Row): boolean {
  let state = clauseState(toClauseStatus(row))
  return state === 'review' || state === 'unarchived'
}

function toQueuedClause(row: Row): QueuedClause {
  return {
    ...toClauseStatus(row),
    archiveError: text(row['archive_error']),
    articleId: Number(row['article_id']),
    articleName: String(row['article_name'] ?? ''),
    authorEmail: String(row['author_email']),
    authorName: String(row['author_name']),
    consentVerifiedByName: text(row['consent_verified_by_name']),
    id: Number(row['id']),
    issueName: String(row['issue_name'] ?? ''),
    replyReceivedAt: parseStamp(row['reply_received_at']),
    replyText: text(row['reply_text']),
  }
}

/** The article has no standing marking. */
const NO_FINAL_VERSION = sql`id NOT IN (SELECT article_id FROM final_versions WHERE ${STANDING})`

async function byFormKey(db: Database, formKey: string): Promise<ArticleRow | null> {
  let result = await db.exec(sql`SELECT * FROM articles WHERE form_key = ${formKey}`)
  let [row] = await withAuthors(db, result.rows ?? [])
  return row ?? null
}

async function byId(db: Database, id: number): Promise<ArticleRow | null> {
  let result = await db.exec(sql`SELECT * FROM articles WHERE id = ${id}`)
  let [row] = await withAuthors(db, result.rows ?? [])
  return row ?? null
}

export function createArticleStore(database: Database): ArticleStore {
  return {
    async abandonedAttempts() {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE created_at IS NULL ORDER BY id`,
      )
      return withAuthors(database, result.rows ?? [])
    },

    commit(id, at) {
      return database.transaction(async (db) => {
        await db.exec(
          sql`UPDATE articles SET created_at = ${stamp(at)}, cleanup_at = NULL
              WHERE id = ${id} AND created_at IS NULL`,
        )
        let row = await byId(db, id)
        if (row === null) throw new Error('The article was not written.')
        if (row.artworksFolderId === null || row.licencesFolderId === null) {
          throw new Error('An article was committed without its two folders.')
        }
        let existing = await db.exec(
          sql`SELECT id FROM links WHERE article_id = ${id} AND kind = 'artworks'`,
        )
        if ((existing.rows ?? []).length === 0) {
          await insertLink(db, { articleId: id, at, issueId: row.issueId, kind: 'artworks' })
        }
        return asArticle(row)
      })
    },

    async clearMissing(id, kinds) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kinds.includes('article')) {
        await database.exec(sql`UPDATE articles SET folder_missing_at = NULL WHERE id = ${id}`)
      }
      if (kinds.includes('artworks')) {
        await database.exec(
          sql`UPDATE articles SET artworks_folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
      if (kinds.includes('licences')) {
        await database.exec(
          sql`UPDATE articles SET licences_folder_missing_at = NULL WHERE id = ${id}`,
        )
      }
    },

    async countsByIssue() {
      let result = await database.exec(
        sql`SELECT issue_id, count(*) AS count FROM articles
            WHERE created_at IS NOT NULL GROUP BY issue_id`,
      )
      let counts = new Map<number, number>()
      for (let row of result.rows ?? []) counts.set(Number(row['issue_id']), Number(row['count']))
      return counts
    },

    async discard(id) {
      await database.exec(sql`DELETE FROM articles WHERE id = ${id} AND created_at IS NULL`)
    },

    findByFormKey(formKey) {
      return byFormKey(database, formKey)
    },

    findById(id) {
      return byId(database, id)
    },

    async findForQueue(id) {
      let result = await database.exec(
        sql`SELECT articles.name, issues.name AS issue_name, issues.closed_at,
              EXISTS (SELECT 1 FROM final_versions f
                      WHERE f.article_id = articles.id AND ${STANDING_F}) AS has_final
            FROM articles
            JOIN issues ON issues.id = articles.issue_id
            WHERE articles.id = ${id} AND articles.created_at IS NOT NULL
              AND articles.handed_over_at IS NOT NULL`,
      )
      let row = result.rows?.[0]
      if (row === undefined) return null
      return {
        hasFinalVersion: Number(row['has_final']) === 1,
        isIssueClosed: row['closed_at'] !== null,
        issueName: String(row['issue_name']),
        name: String(row['name']),
      }
    },

    handOver(id, by, at) {
      return database.transaction(async (db) => {
        /* The announcement stays: it says what the proofreaders last heard, and a handover newer
           than it is new to them (`12n`). */
        let result = await db.exec(
          sql`UPDATE articles
              SET handed_over_at = ${stamp(at)}, handed_over_by_email = ${by.email},
                  handed_over_by_name = ${by.name}, handover_cancelled_at = NULL
              WHERE id = ${id} AND created_at IS NOT NULL AND ${NO_TAKE}
                AND (handed_over_at IS NULL OR handover_cancelled_at IS NOT NULL)`,
        )
        if ((result.affectedRows ?? 0) > 0) return { at, kind: 'done' }
        return refusalOf(await byId(db, id))
      })
    },

    cancelHandover(id, at, handedOverAt) {
      return database.transaction(async (db) => {
        let result =
          handedOverAt === undefined
            ? await db.exec(
                sql`UPDATE articles SET handover_cancelled_at = ${stamp(at)}
                    WHERE id = ${id} AND created_at IS NOT NULL AND ${NO_TAKE}
                      AND handed_over_at IS NOT NULL AND handover_cancelled_at IS NULL`,
              )
            : await db.exec(
                sql`UPDATE articles SET handover_cancelled_at = ${stamp(at)}
                    WHERE id = ${id} AND created_at IS NOT NULL AND ${NO_TAKE}
                      AND handed_over_at = ${stamp(handedOverAt)}
                      AND handover_cancelled_at IS NULL`,
              )
        if ((result.affectedRows ?? 0) > 0) return { at, kind: 'done' }
        return refusalOf(await byId(db, id))
      })
    },

    restoreHandover(id, cancelledAt) {
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`UPDATE articles SET handover_cancelled_at = NULL
              WHERE id = ${id} AND created_at IS NOT NULL AND ${NO_TAKE}
                AND handover_cancelled_at = ${stamp(cancelledAt)}`,
        )
        let row = await byId(db, id)
        if ((result.affectedRows ?? 0) > 0 && row?.handover != null) {
          return { at: row.handover.at, kind: 'done' }
        }
        return refusalOf(row)
      })
    },

    async listForDigest() {
      let result = await database.exec(
        sql`SELECT articles.*, issues.name AS issue_name FROM articles
            JOIN issues ON issues.id = articles.issue_id
            WHERE issues.closed_at IS NULL AND articles.created_at IS NOT NULL
              AND (articles.proofread_at IS NULL OR articles.proofreading_cancelled_at IS NOT NULL)
              AND articles.handed_over_at IS NOT NULL
              AND (articles.handover_cancelled_at IS NULL
                   OR articles.handover_announced_at IS NOT NULL)
            ORDER BY articles.handed_over_at, articles.id`,
      )
      let rows = result.rows ?? []
      let withNames = await withAuthors(database, rows)
      return rows.map((row, index) => ({
        announcedAt: parseStamp(row['handover_announced_at']),
        authors: (withNames[index]?.authors ?? []).map((author) => author.name),
        cancelledAt: parseStamp(row['handover_cancelled_at']),
        handedOverAt: parseStamp(row['handed_over_at']) ?? EPOCH,
        id: Number(row['id']),
        issueName: String(row['issue_name']),
        name: String(row['name']),
      }))
    },

    async listForQueue() {
      let result = await database.exec(
        sql`SELECT articles.*, issues.name AS issue_name FROM articles
            JOIN issues ON issues.id = articles.issue_id
            WHERE issues.closed_at IS NULL AND articles.created_at IS NOT NULL
            ORDER BY articles.created_at, articles.id`,
      )
      let rows = result.rows ?? []
      let withNames = await withAuthors(database, rows)
      return withNames.map((article, index) => ({
        authors: article.authors.map((author) => author.name),
        cancelledProofreading: article.cancelledProofreading,
        createdAt: article.createdAt ?? EPOCH,
        docId: article.docId ?? '',
        finalVersion: article.finalVersion,
        handover: article.handover,
        id: article.id,
        issueName: String(rows[index]?.['issue_name']),
        name: article.name,
        proofreading: article.proofreading,
      }))
    },

    async queueCount() {
      let result = await database.exec(
        sql`SELECT count(*) AS count FROM articles
            WHERE created_at IS NOT NULL AND ${NO_TAKE} AND ${IN_OPEN_ISSUE}
              AND handed_over_at IS NOT NULL AND handover_cancelled_at IS NULL`,
      )
      return Number(result.rows?.[0]?.['count'] ?? 0)
    },

    markAnnounced(digest, at) {
      return database.transaction(async (db) => {
        /* Each mark is keyed on the handover the digest spoke of, not on whether it is cancelled
           now: a cancellation or a _Vrátit_ made while the Mailer was sending must still be told
           in the next digest. A newer handover changes `handed_over_at`, so no mark touches it. */
        for (let item of digest.handedOver) {
          await db.exec(
            sql`UPDATE articles SET handover_announced_at = ${stamp(at)}
                WHERE id = ${item.id} AND handed_over_at = ${stamp(item.handedOverAt)}`,
          )
        }
        /* The proofreaders now know the cancelled handover is not theirs: nothing is left to
           tell of it, unless _Vrátit_ brings it back, and then it is new to them. */
        for (let item of digest.cancelled) {
          await db.exec(
            sql`UPDATE articles SET handover_announced_at = NULL
                WHERE id = ${item.id} AND handed_over_at = ${stamp(item.handedOverAt)}`,
          )
        }
      })
    },

    async listCreated(issueId) {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE issue_id = ${issueId} AND created_at IS NOT NULL
            ORDER BY created_at DESC, id DESC`,
      )
      return (await withAuthors(database, result.rows ?? [])).map(asArticle)
    },

    async markForCleanup(id, at) {
      await database.exec(
        sql`UPDATE articles SET cleanup_at = ${stamp(at)} WHERE id = ${id} AND created_at IS NULL`,
      )
    },

    async markMissing(id, kinds, at) {
      let when = stamp(at)
      if (kinds.includes('article')) {
        await database.exec(
          sql`UPDATE articles SET folder_missing_at = coalesce(folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
      if (kinds.includes('artworks')) {
        await database.exec(
          sql`UPDATE articles
              SET artworks_folder_missing_at = coalesce(artworks_folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
      if (kinds.includes('licences')) {
        await database.exec(
          sql`UPDATE articles
              SET licences_folder_missing_at = coalesce(licences_folder_missing_at, ${when})
              WHERE id = ${id}`,
        )
      }
    },

    takeProofreading(id, by, at, shown) {
      return database.transaction(async (db) => {
        let standingHandover =
          shown === 'handedOver'
            ? sql`AND handed_over_at IS NOT NULL AND handover_cancelled_at IS NULL`
            : sql``
        let result = await db.exec(
          sql`UPDATE articles
              SET proofread_at = ${stamp(at)}, proofread_by_email = ${by.email},
                  proofread_by_name = ${by.name}, proofreading_cancelled_at = NULL
              WHERE id = ${id} AND created_at IS NOT NULL AND ${NO_TAKE} AND ${IN_OPEN_ISSUE}
                ${standingHandover}`,
        )
        if ((result.affectedRows ?? 0) > 0) {
          let row = await byId(db, id)
          return { at, isHandedOver: row?.handover != null, kind: 'done' }
        }
        return proofreadingRefusalOf(db, id)
      })
    },

    cancelProofreading(id, at, options = {}) {
      return database.transaction(async (db) => {
        let take =
          options.proofreadAt === undefined
            ? sql``
            : sql`AND proofread_at = ${stamp(options.proofreadAt)}`
        let owner =
          options.owner === undefined ? sql`` : sql`AND proofread_by_email = ${options.owner}`
        let result = await db.exec(
          sql`UPDATE articles SET proofreading_cancelled_at = ${stamp(at)}
              WHERE id = ${id} AND created_at IS NOT NULL AND proofread_at IS NOT NULL
                AND proofreading_cancelled_at IS NULL AND ${IN_OPEN_ISSUE} AND ${NO_FINAL_VERSION}
                ${take} ${owner}`,
        )
        if ((result.affectedRows ?? 0) > 0) {
          let row = await byId(db, id)
          return { at, isHandedOver: row?.handover != null, kind: 'done' }
        }
        return proofreadingRefusalOf(db, id)
      })
    },

    restoreProofreading(id, cancelledAt, options = {}) {
      return database.transaction(async (db) => {
        let owner =
          options.owner === undefined ? sql`` : sql`AND proofread_by_email = ${options.owner}`
        let result = await db.exec(
          sql`UPDATE articles SET proofreading_cancelled_at = NULL
              WHERE id = ${id} AND created_at IS NOT NULL
                AND proofreading_cancelled_at = ${stamp(cancelledAt)} AND ${IN_OPEN_ISSUE} ${owner}`,
        )
        let row = await byId(db, id)
        if ((result.affectedRows ?? 0) > 0 && row?.proofreading != null) {
          return { at: row.proofreading.at, isHandedOver: row.handover !== null, kind: 'done' }
        }
        return proofreadingRefusalOf(db, id)
      })
    },

    checkFinalVersion(id, takenAt, owner) {
      return finalVersionRefusalOf(database, id, takenAt, owner)
    },

    markFinalVersion(input) {
      return database.transaction(async (db) => {
        let refusal = await finalVersionRefusalOf(db, input.id, input.takenAt, input.owner)
        if (refusal !== null) return refusal
        let row = await byId(db, input.id)
        if (row === null) return { kind: 'gone' }
        let inserted = await db.exec(
          sql`INSERT INTO final_versions
                (article_id, marked_at, marked_by_email, marked_by_name, pdf_file_id, pdf_hash,
                 attempt_key)
              VALUES (${input.id}, ${stamp(input.at)}, ${input.by.email}, ${input.by.name},
                      ${input.pdf.fileId}, ${input.pdf.hash}, ${input.pdf.attemptKey})
              RETURNING id`,
        )
        let versionId = Number(inserted.rows?.[0]?.['id'])
        /* The signature is the author's name as the form took it, as the script writes it. */
        for (let author of row.authors) {
          await db.exec(
            sql`INSERT INTO article_clauses
                  (final_version_id, article_id, position, author_name, author_email, signature,
                   clause_key)
                VALUES (${versionId}, ${input.id}, ${author.position}, ${author.name},
                        ${author.email}, ${author.name},
                        ${clauseKey(input.id, author.position, input.at)})`,
          )
        }
        return { at: input.at, kind: 'done' }
      })
    },

    cancelFinalVersion(id, at, markedAt, owner) {
      return database.transaction(async (db) => {
        let refusal = await cancelFinalRefusalOf(db, id, markedAt, owner)
        if (refusal !== null) return refusal
        let result = await db.exec(
          sql`UPDATE final_versions SET cancelled_at = ${stamp(at)}
              WHERE article_id = ${id} AND ${STANDING} AND marked_at = ${stamp(markedAt)}
                AND id NOT IN (SELECT final_version_id FROM article_clauses
                               WHERE first_claimed_at IS NOT NULL)
              RETURNING id, pdf_file_id, replaces_version_id`,
        )
        let cancelled = result.rows?.[0]
        if (cancelled === undefined) return { kind: 'too-late' }
        await db.exec(
          sql`DELETE FROM article_clauses WHERE final_version_id = ${Number(cancelled['id'])}`,
        )
        /* Nobody heard of the new version yet: the one it replaced stands again as it was, its
           clauses where they were (`12s`). */
        let restored = null
        if (cancelled['replaces_version_id'] !== null) {
          let back = await db.exec(
            sql`UPDATE final_versions SET replaced_at = NULL
                WHERE id = ${Number(cancelled['replaces_version_id'])}
                RETURNING marked_at`,
          )
          restored = parseStamp(back.rows?.[0]?.['marked_at'])
        }
        return { kind: 'done', pdfFileId: String(cancelled['pdf_file_id']), restored }
      })
    },

    checkReplaceFinalVersion(id, markedAt) {
      return replaceFinalRefusalOf(database, id, markedAt)
    },

    replaceFinalVersion(input) {
      return database.transaction(async (db) => {
        let refusal = await replaceFinalRefusalOf(db, input.id, input.markedAt)
        if (refusal !== null) return refusal
        let row = await byId(db, input.id)
        if (row === null) return { kind: 'gone' }
        /* The old marking stops standing first: one standing marking per article. */
        let replaced = await db.exec(
          sql`UPDATE final_versions SET replaced_at = ${stamp(input.at)}
              WHERE article_id = ${input.id} AND ${STANDING}
                AND marked_at = ${stamp(input.markedAt)}
              RETURNING id`,
        )
        let replacedId = Number(replaced.rows?.[0]?.['id'])
        let inserted = await db.exec(
          sql`INSERT INTO final_versions
                (article_id, marked_at, marked_by_email, marked_by_name, pdf_file_id, pdf_hash,
                 attempt_key, replaces_version_id)
              VALUES (${input.id}, ${stamp(input.at)}, ${input.by.email}, ${input.by.name},
                      ${input.pdf.fileId}, ${input.pdf.hash}, ${input.pdf.attemptKey},
                      ${replacedId})
              RETURNING id`,
        )
        let versionId = Number(inserted.rows?.[0]?.['id'])
        let earlier = await db.exec(
          sql`SELECT id, author_email FROM article_clauses WHERE final_version_id = ${replacedId}`,
        )
        /* The same author by address: the authors are the article's as they are now, and one
           added since has no earlier request to replace. */
        let earlierOf = new Map<string, number>()
        for (let clause of earlier.rows ?? []) {
          earlierOf.set(String(clause['author_email']).toLowerCase(), Number(clause['id']))
        }
        for (let author of row.authors) {
          await db.exec(
            sql`INSERT INTO article_clauses
                  (final_version_id, article_id, position, author_name, author_email, signature,
                   clause_key, replaces_clause_id)
                VALUES (${versionId}, ${input.id}, ${author.position}, ${author.name},
                        ${author.email}, ${author.name},
                        ${clauseKey(input.id, author.position, input.at)},
                        ${earlierOf.get(author.email.toLowerCase()) ?? null})`,
          )
        }
        return { at: input.at, kind: 'done' }
      })
    },

    async replacedVersions(id) {
      let versions = await database.exec(
        sql`SELECT * FROM final_versions
            WHERE article_id = ${id} AND replaced_at IS NOT NULL
            ORDER BY marked_at DESC`,
      )
      let rows = versions.rows ?? []
      let ids = JSON.stringify(rows.map((row) => Number(row['id'])))
      let clauses = await database.exec(
        sql`SELECT * FROM article_clauses
            WHERE final_version_id IN (SELECT value FROM json_each(${ids}))
            ORDER BY position`,
      )
      return rows.map((row) => ({
        at: parseStamp(row['marked_at']) ?? EPOCH,
        authors: (clauses.rows ?? [])
          .filter((clause) => Number(clause['final_version_id']) === Number(row['id']))
          .map(toClauseDetail),
        email: String(row['marked_by_email']),
        name: text(row['marked_by_name']),
        pdfFileId: String(row['pdf_file_id']),
        replacedAt: parseStamp(row['replaced_at']) ?? EPOCH,
      }))
    },

    async replacingVersionOf(clauseId) {
      let result = await database.exec(
        sql`SELECT s.marked_at, s.marked_by_email, s.marked_by_name
            FROM article_clauses c
            JOIN final_versions f ON f.id = c.final_version_id
            JOIN final_versions s ON s.article_id = f.article_id
            WHERE c.id = ${clauseId} AND f.replaced_at IS NOT NULL
              AND s.cancelled_at IS NULL AND s.replaced_at IS NULL`,
      )
      let row = result.rows?.[0]
      if (row === undefined) return null
      return {
        at: parseStamp(row['marked_at']) ?? EPOCH,
        email: String(row['marked_by_email']),
        name: text(row['marked_by_name']),
      }
    },

    claimForSending(runKey, at) {
      let lease = stamp(at.subtract({ minutes: CLAIM_MINUTES }))
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`SELECT c.id FROM article_clauses c
              JOIN final_versions f ON f.id = c.final_version_id
              JOIN articles a ON a.id = c.article_id
              JOIN issues i ON i.id = a.issue_id
              WHERE c.state = 'pending' AND ${STANDING_F} AND i.closed_at IS NULL
                AND (c.claimed_at IS NULL OR c.claimed_at < ${lease})
              ORDER BY f.marked_at, c.id
              LIMIT ${CLAIM_LIMIT}`,
        )
        let ids = JSON.stringify((result.rows ?? []).map((row) => Number(row['id'])))
        await db.exec(
          sql`UPDATE article_clauses
              SET claim_key = ${runKey}, claimed_at = ${stamp(at)},
                  first_claimed_at = coalesce(first_claimed_at, ${stamp(at)})
              WHERE id IN (SELECT value FROM json_each(${ids}))`,
        )
        let claimed = await db.exec(
          sql`SELECT c.*, a.name AS article_name, a.doc_id, i.name AS issue_name, f.pdf_file_id,
                f.pdf_hash,
                EXISTS (SELECT 1 FROM article_clauses p
                        WHERE p.id = c.replaces_clause_id AND p.first_claimed_at IS NOT NULL)
                  AS replaces_earlier
              FROM article_clauses c
              JOIN final_versions f ON f.id = c.final_version_id
              JOIN articles a ON a.id = c.article_id
              JOIN issues i ON i.id = a.issue_id
              WHERE c.id IN (SELECT value FROM json_each(${ids}))
              ORDER BY f.marked_at, c.id`,
        )
        return (claimed.rows ?? []).map((row) => ({
          articleName: String(row['article_name']),
          authorEmail: String(row['author_email']),
          authorName: String(row['author_name']),
          clauseKey: String(row['clause_key']),
          docId: String(row['doc_id']),
          issueName: String(row['issue_name']),
          pdfFileId: String(row['pdf_file_id']),
          pdfHash: String(row['pdf_hash']),
          replacesEarlier: Number(row['replaces_earlier']) === 1,
          sendKey: sendKey(String(row['clause_key']), Number(row['send_attempt'])),
          signature: String(row['signature']),
        }))
      })
    },

    resendClauses(id, markedAt) {
      return database.transaction(async (db) => {
        let found = await withIssue(db, id)
        if (found === null) return { kind: 'gone' }
        let { isClosed, issueName, row } = found
        if (isClosed) return { issueName, kind: 'closed' }
        if (row.finalVersion === null || !row.finalVersion.at.equals(markedAt)) {
          return { kind: 'nothing' }
        }
        /* `isResendable` for SQL: sent or not confirmed, with no reply, consent or failed archive.
           The lease goes too, so the next run takes it; a reply run that held it and reports
           after this is answered `unknown`, and the next one reads the same reply again. */
        let result = await db.exec(
          sql`UPDATE article_clauses
              SET state = 'pending', error = NULL, sent_at = NULL, claimed_at = NULL,
                  send_attempt = send_attempt + 1
              WHERE final_version_id = (SELECT id FROM final_versions
                                        WHERE article_id = ${id} AND ${STANDING}
                                          AND marked_at = ${stamp(markedAt)})
                AND state != 'pending' AND approved_at IS NULL AND archive_failed_at IS NULL
                AND reply_message_id IS NULL`,
        )
        let count = result.affectedRows ?? 0
        return count === 0 ? { kind: 'nothing' } : { count, kind: 'done' }
      })
    },

    recordSending(runKey, key, outcome, at) {
      return database.transaction(async (db) => {
        /* Reported, so the lease ends. A clause already sent stays sent: a clause reported twice
           in one report cannot turn it into a failure. A clause with a reply was claimed to be
           asked about, not sent, so a sending result does not touch it. */
        let result =
          outcome.kind === 'sent'
            ? await db.exec(
                sql`UPDATE article_clauses
                    SET state = 'sent', sent_at = coalesce(sent_at, ${stamp(at)}), error = NULL,
                        claimed_at = NULL
                    WHERE clause_key = ${key} AND claim_key = ${runKey}
                      AND reply_message_id IS NULL`,
              )
            : await db.exec(
                sql`UPDATE article_clauses
                    SET state = 'failed', error = ${outcome.error}, claimed_at = NULL
                    WHERE clause_key = ${key} AND claim_key = ${runKey} AND state != 'sent'
                      AND reply_message_id IS NULL`,
              )
        if ((result.affectedRows ?? 0) > 0) return 'done'
        let found = await db.exec(
          sql`SELECT id FROM article_clauses WHERE clause_key = ${key} AND claim_key = ${runKey}`,
        )
        return (found.rows ?? []).length > 0 ? 'done' : 'unknown'
      })
    },

    claimForReplies(runKey, at) {
      let lease = stamp(at.subtract({ minutes: CLAIM_MINUTES }))
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`SELECT c.id FROM article_clauses c
              JOIN final_versions f ON f.id = c.final_version_id
              JOIN articles a ON a.id = c.article_id
              JOIN issues i ON i.id = a.issue_id
              WHERE c.state != 'pending' AND c.approved_at IS NULL AND ${STANDING_F}
                AND i.closed_at IS NULL
                AND (c.claimed_at IS NULL OR c.claimed_at < ${lease})
              ORDER BY coalesce(c.checked_at, ''), c.id
              LIMIT ${REPLY_CLAIM_LIMIT}`,
        )
        let ids = JSON.stringify((result.rows ?? []).map((row) => Number(row['id'])))
        await db.exec(
          sql`UPDATE article_clauses SET claim_key = ${runKey}, claimed_at = ${stamp(at)}
              WHERE id IN (SELECT value FROM json_each(${ids}))`,
        )
        let claimed = await db.exec(
          sql`SELECT c.*, a.name AS article_name, i.name AS issue_name,
                CASE WHEN a.licences_folder_missing_at IS NULL THEN a.licences_folder_id END
                  AS licences_folder_id
              FROM article_clauses c
              JOIN articles a ON a.id = c.article_id
              JOIN issues i ON i.id = a.issue_id
              WHERE c.id IN (SELECT value FROM json_each(${ids}))
              ORDER BY coalesce(c.checked_at, ''), c.id`,
        )
        return (claimed.rows ?? []).map((row) => ({
          articleName: String(row['article_name']),
          authorEmail: String(row['author_email']),
          authorName: String(row['author_name']),
          clauseKey: String(row['clause_key']),
          isVerified: row['consent_verified_at'] !== null,
          issueName: String(row['issue_name']),
          licencesFolderId: text(row['licences_folder_id']),
        }))
      })
    },

    recordReply(runKey, key, report, at) {
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`SELECT c.*, f.replaced_at FROM article_clauses c
              JOIN final_versions f ON f.id = c.final_version_id
              WHERE c.clause_key = ${key} AND c.claim_key = ${runKey} AND c.state != 'pending'`,
        )
        /* A clause still to send was claimed for sending, and has no reply to report. */
        let row = result.rows?.[0]
        if (row === undefined) return 'unknown'
        let id = Number(row['id'])
        /* A newer version replaced this one while the run held it: the clause stays as it stood
           then, and a conversation the job archived for it is binned, as nothing counts it. */
        if (row['replaced_at'] !== null) {
          await db.exec(sql`UPDATE article_clauses SET claimed_at = NULL WHERE id = ${id}`)
          return report.state !== 'failed' &&
            report.state !== 'no_reply' &&
            report.archive !== null &&
            'fileId' in report.archive
            ? 'superseded'
            : 'accepted'
        }
        let decision = decideReport({ ...toClauseStatus(row), discardedAt: null }, report, at)
        await applyConsentPatch(db, 'clauses', id, decision.patch)
        /* A reply to an e-mail the Mailer did not confirm shows that it went after all, by the
           time the reply came at the latest. */
        if (decision.patch.reply !== undefined && row['state'] === 'failed') {
          await db.exec(
            sql`UPDATE article_clauses SET state = 'sent', error = NULL,
                  sent_at = coalesce(sent_at, reply_received_at)
                WHERE id = ${id}`,
          )
        }
        /* Reported, so the next run may take it; the key stays for a repeat of this report. */
        await db.exec(sql`UPDATE article_clauses SET claimed_at = NULL WHERE id = ${id}`)
        return decision.answer
      })
    },

    verifyClause(id, replyMessageId, editor, at) {
      return database.transaction(async (db) => {
        let result = await db.exec(
          sql`SELECT c.*, i.closed_at, f.cancelled_at, f.replaced_at FROM article_clauses c
              JOIN final_versions f ON f.id = c.final_version_id
              JOIN articles a ON a.id = c.article_id
              JOIN issues i ON i.id = a.issue_id
              WHERE c.id = ${id}`,
        )
        let row = result.rows?.[0]
        if (
          row === undefined ||
          row['closed_at'] !== null ||
          row['cancelled_at'] !== null ||
          row['replaced_at'] !== null
        ) {
          return false
        }
        if (clauseState(toClauseStatus(row)) !== 'review') return false
        /* The reply the editor read, not one that arrived after the page was drawn. */
        if (row['reply_message_id'] !== replyMessageId) return false
        await db.exec(
          sql`UPDATE article_clauses SET consent_verified_at = ${stamp(at)},
                consent_verified_by_email = ${editor.email},
                consent_verified_by_name = ${editor.displayName}
              WHERE id = ${id}`,
        )
        return true
      })
    },

    async undoClauseVerification(id) {
      /* Only in the window `13b` gives it: once the archive failed, the decision stands (`13c`). */
      let result = await database.exec(
        sql`UPDATE article_clauses SET consent_verified_at = NULL,
              consent_verified_by_email = NULL, consent_verified_by_name = NULL
            WHERE id = ${id} AND approved_at IS NULL AND archive_failed_at IS NULL
              AND consent_verified_at IS NOT NULL
              AND final_version_id IN (SELECT id FROM final_versions WHERE ${STANDING})`,
      )
      return (result.affectedRows ?? 0) === 1
    },

    async reviewQueue(including) {
      let result = await database.exec(CLAUSE_QUEUE_CANDIDATES)
      return (result.rows ?? [])
        .filter((row) => Number(row['id']) === including || isQueuedClause(row))
        .map(toQueuedClause)
    },

    async reviewCount() {
      let result = await database.exec(CLAUSE_QUEUE_CANDIDATES)
      return (result.rows ?? []).filter(isQueuedClause).length
    },

    async markWelcome(articleId, position, outcome, at) {
      if (outcome === 'sent') {
        await database.exec(
          sql`UPDATE article_authors SET welcome_sent_at = ${stamp(at)}, welcome_failed_at = NULL
              WHERE article_id = ${articleId} AND position = ${position}`,
        )
      } else {
        await database.exec(
          sql`UPDATE article_authors SET welcome_failed_at = ${stamp(at)}
              WHERE article_id = ${articleId} AND position = ${position} AND welcome_sent_at IS NULL`,
        )
      }
    },

    async missingCountsByIssue() {
      let result = await database.exec(
        sql`SELECT issue_id, count(*) AS count FROM articles
            WHERE created_at IS NOT NULL AND (
              folder_missing_at IS NOT NULL
              OR artworks_folder_missing_at IS NOT NULL
              OR licences_folder_missing_at IS NOT NULL
              OR id IN (SELECT c.article_id FROM article_clauses c
                        JOIN final_versions f ON f.id = c.final_version_id
                        WHERE ${STANDING_F} AND ${WAITS_ON_EDITORS})
            )
            GROUP BY issue_id`,
      )
      let counts = new Map<number, number>()
      for (let row of result.rows ?? []) counts.set(Number(row['issue_id']), Number(row['count']))
      return counts
    },

    async pendingCleanups() {
      let result = await database.exec(
        sql`SELECT * FROM articles WHERE created_at IS NULL AND cleanup_at IS NOT NULL ORDER BY id`,
      )
      return withAuthors(database, result.rows ?? [])
    },

    async recentAttempts(linkId, since) {
      let result = await database.exec(
        sql`SELECT count(*) AS count FROM articles
            WHERE link_id = ${linkId} AND started_at >= ${stamp(since)}`,
      )
      return Number(result.rows?.[0]?.['count'] ?? 0)
    },

    async setDriveId(id, kind, fileId) {
      /* One statement per column, which a template cannot bind as a name. */
      if (kind === 'folder') {
        await database.exec(
          sql`UPDATE articles SET folder_id = ${fileId} WHERE id = ${id} AND folder_id IS NULL`,
        )
      } else if (kind === 'artworks-folder') {
        await database.exec(
          sql`UPDATE articles SET artworks_folder_id = ${fileId}
              WHERE id = ${id} AND artworks_folder_id IS NULL`,
        )
      } else if (kind === 'licences-folder') {
        await database.exec(
          sql`UPDATE articles SET licences_folder_id = ${fileId}
              WHERE id = ${id} AND licences_folder_id IS NULL`,
        )
      } else if (kind === 'doc') {
        await database.exec(
          sql`UPDATE articles SET doc_id = ${fileId} WHERE id = ${id} AND doc_id IS NULL`,
        )
      } else {
        await database.exec(
          sql`UPDATE articles SET meta_file_id = ${fileId} WHERE id = ${id} AND meta_file_id IS NULL`,
        )
      }
    },

    startAttempt(attempt) {
      return database.transaction(async (db) => {
        let existing = await byFormKey(db, attempt.formKey)
        if (existing !== null) return { attempt: existing, isNew: false }

        await db.exec(
          sql`INSERT INTO articles (issue_id, link_id, form_key, name, started_at)
              VALUES (${attempt.issueId}, ${attempt.linkId}, ${attempt.formKey}, ${attempt.name}, ${stamp(attempt.at)})`,
        )
        let inserted = await byFormKey(db, attempt.formKey)
        if (inserted === null) throw new Error('The attempt was not written.')
        for (let [index, author] of attempt.authors.entries()) {
          await db.exec(
            sql`INSERT INTO article_authors (article_id, position, name, email)
                VALUES (${inserted.id}, ${index + 1}, ${author.name}, ${author.email})`,
          )
        }
        let row = await byId(db, inserted.id)
        if (row === null) throw new Error('The attempt was not written.')
        return { attempt: row, isNew: true }
      })
    },
  }
}
