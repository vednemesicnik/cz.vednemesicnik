/**
 * What a run of the reply check reports about one batch, and what that does to it (#31).
 *
 * The job asks `SCRIPT__Mail__Reply_Check` about the provider's latest reply, archives the
 * conversation into the article's `Licence` where it may, and reports both at once. The app keeps
 * the reply's own text and the IDs; Gmail and the PDF keep the conversation.
 */

import { type BatchStatus, mayArchive } from './artwork.ts'
import { RUN_LIMIT_MINUTES } from './job-run.ts'
import { tied } from './public/typography.ts'

/** The job of the reply check, as `job_runs` names it, and what a person reads of it (`14d`). */
export const REPLY_CHECK_JOB = 'artwork-replies'
export const REPLY_CHECK_JOB_NAME = tied`Odpovědi k obrazovým dílům`

/** The word Reply_Check compares the reply with, as the consent e-mail asks for it. */
export const EXPECTED_REPLY = 'Souhlasím'

/** A batch claimed this recently is not handed to another run: one run lasts six minutes at most. */
export const CLAIM_MINUTES = RUN_LIMIT_MINUTES

/** The batches one run may take, as many as one Reply_Check request carries. */
export const CLAIM_LIMIT = 100

/** More than any reply a person writes, and the most the queue will quote. */
export const REPLY_TEXT_LIMIT = 10_000

export type ReplyState = 'failed' | 'no_reply' | 'other_reply' | 'reply_matches'

export type ReportedReply = {
  messageId: string
  receivedAt: Temporal.Instant
  text: string
  threadId: string
}

export type ReportedArchive = { fileId: string } | { error: string }

export type BatchReport =
  | { state: 'failed' }
  | { state: 'no_reply' }
  | { archive: ReportedArchive | null; reply: ReportedReply; state: 'other_reply' }
  | { archive: ReportedArchive | null; reply: ReportedReply; state: 'reply_matches' }

/** What changes on the batch. Every field left out stays as it is. */
export type BatchPatch = {
  approved?: { at: Temporal.Instant; fileId: string }
  archiveFailed?: { at: Temporal.Instant; error: string }
  checkedAt?: Temporal.Instant
  /** A newer reply: the decision and the failed archive were about the one before it. */
  isDecisionReset?: true
  reply?: ReportedReply & { isExactConsent: boolean }
}

export type ReportDecision = {
  /** `superseded`: the job archived a consent that was taken back meanwhile; it bins the PDF. */
  answer: 'accepted' | 'superseded'
  patch: BatchPatch
}

/** Reply_Check could not tell there was a reply, so the decision of a person has nothing to archive. */
export const NO_CONVERSATION_ERROR =
  'Konverzace s odpovědí poskytovatele nebyla nalezena. Souhlas nelze archivovat.'

/**
 * Decides what one report does, on the batch as it stands now, not as it was when the job claimed
 * it: a _Vrátit_ that came in between wins over the archive.
 *
 * A reply with a message the batch has not seen goes through _Ke kontrole_ first (`13a`): a
 * _Je to souhlas_ and a failed archive were about the reply before it, so both are dropped, and a
 * retraction is never archived on the strength of an older decision.
 */
export function decideReport(
  batch: BatchStatus,
  report: BatchReport,
  at: Temporal.Instant,
): ReportDecision {
  if (batch.approvedAt !== null) return { answer: 'accepted', patch: {} }
  /* Asked about, so it waits its turn behind the batches nobody asked about yet. */
  if (report.state === 'failed') return { answer: 'accepted', patch: { checkedAt: at } }
  if (report.state === 'no_reply') {
    if (batch.consentVerifiedAt === null) return { answer: 'accepted', patch: { checkedAt: at } }
    return {
      answer: 'accepted',
      patch: { archiveFailed: { at, error: NO_CONVERSATION_ERROR }, checkedAt: at },
    }
  }

  let isExactConsent = report.state === 'reply_matches'
  let isNewReply = batch.replyMessageId !== null && batch.replyMessageId !== report.reply.messageId
  let patch: BatchPatch = { checkedAt: at, reply: { ...report.reply, isExactConsent } }
  if (isNewReply) patch.isDecisionReset = true
  let isArchivable = mayArchive({
    ...batch,
    consentVerifiedAt: isNewReply ? null : batch.consentVerifiedAt,
    isExactConsent,
    replyMessageId: report.reply.messageId,
  })

  if (report.archive === null) return { answer: 'accepted', patch }
  if ('fileId' in report.archive) {
    if (!isArchivable) return { answer: 'superseded', patch }
    return {
      answer: 'accepted',
      patch: { ...patch, approved: { at, fileId: report.archive.fileId } },
    }
  }
  if (!isArchivable) return { answer: 'accepted', patch }
  return {
    answer: 'accepted',
    patch: { ...patch, archiveFailed: { at, error: report.archive.error } },
  }
}
