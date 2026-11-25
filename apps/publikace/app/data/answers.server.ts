import type { Database } from 'remix/data-table'
import { sql } from 'remix/data-table'

import { answerIdempotencyKey, type AnswerKind, isInFlight } from '../domain/answer.ts'
import { APPROVAL_SUBJECT_PREFIX, clauseState, type ClauseStatus } from '../domain/approvals.ts'
import { batchState, consentSubject } from '../domain/artwork.ts'
import { parseStamp, stamp } from '../domain/time.ts'
import { answeredAtOf } from './consent-patch.server.ts'

/**
 * The answers from _Ke kontrole_ to a provider's or an author's reply (`13d`–`13f`,
 * `20261202120000_consent_answers`). A batch and a clause are answered the same way and differ
 * only in which row holds the reply and who it goes to.
 */

/** The card an answer is about. */
export type AnswerTarget = { id: number; kind: AnswerKind }

export type AnswerRow = {
  editorEmail: string
  editorName: string
  failedAt: Temporal.Instant | null
  id: number
  idempotencyKey: string
  inReplyToMessageId: string
  refusedAt: Temporal.Instant | null
  replyReceivedAt: Temporal.Instant
  replyText: string
  sentAt: Temporal.Instant | null
  signatureName: string | null
  startedAt: Temporal.Instant
  target: AnswerTarget
  text: string
}

/** Who the answer goes to and the thread it goes into. */
export type AnswerRecipient = {
  email: string
  issueName: string
  name: string
  /** The subject of the consent request; the Mailer keeps the thread's own, with `Re:`. */
  subject: string
}

/**
 * What asking to send an answer came to. `started` is an answer on record and not yet sent, the
 * new one or one the Mailer did not confirm; each other kind is a reason nothing goes (`13e`):
 *
 * - `newer-reply`: the provider wrote again after the page was drawn;
 * - `taken`: another answer to that message went, `answer` is it;
 * - `locked`: an answer to that message is on record and unsent: one the Mailer did not confirm,
 *   whose text alone may be sent again, or one the post refused for good;
 * - `approved`: an exact „Souhlasím“ came meanwhile, and the job archives it;
 * - `closed`: the issue was closed meanwhile;
 * - `gone`: the card is not in the queue any more, decided meanwhile or a final version that a
 *   newer one replaced (`12s`).
 */
export type StartAnswerOutcome =
  | { answer: AnswerRow; kind: 'started'; recipient: AnswerRecipient }
  | { answer: AnswerRow; kind: 'locked' | 'taken'; recipient: AnswerRecipient }
  /** `recipient` is `null` only for a card that does not exist at all. */
  | { kind: 'approved' | 'closed' | 'gone' | 'newer-reply'; recipient: AnswerRecipient | null }

export type NewAnswer = {
  editor: { displayName: string; email: string }
  /** The reply the card showed, which the answer is to. */
  messageId: string
  signatureName: string | null
  text: string
}

export type AnswerStore = {
  /** The answers of these cards, newest first, by the card's ID. */
  answersOf(kind: AnswerKind, ids: readonly number[]): Promise<Map<number, AnswerRow[]>>
  /** Takes back an answer that never reached the Mailer, as one the daily cap stopped. */
  discard(id: number): Promise<void>
  /** Records what the Mailer said. A sent answer puts the provider on the move (`13e`). */
  mark(id: number, outcome: 'failed' | 'refused' | 'sent', at: Temporal.Instant): Promise<void>
  /**
   * The answer to send again after the Mailer did not confirm it: `started` with the stored
   * answer while the card still waits on that same message, else why not.
   */
  resume(target: AnswerTarget, answerId: number, at: Temporal.Instant): Promise<StartAnswerOutcome>
  /**
   * Puts an answer on record before the Mailer is asked, in one transaction with every check, so
   * two editors or two tabs answering the same message cannot both pass (the unique index).
   */
  start(target: AnswerTarget, answer: NewAnswer, at: Temporal.Instant): Promise<StartAnswerOutcome>
}

type Row = Record<string, unknown>

function text(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

const EPOCH = Temporal.Instant.fromEpochMilliseconds(0)

function toAnswer(row: Row): AnswerRow {
  let batchId = row['batch_id']
  let isBatch = batchId !== null && batchId !== undefined
  return {
    editorEmail: String(row['editor_email']),
    editorName: String(row['editor_name']),
    failedAt: parseStamp(row['failed_at']),
    id: Number(row['id']),
    idempotencyKey: String(row['idempotency_key']),
    inReplyToMessageId: String(row['in_reply_to_message_id']),
    refusedAt: parseStamp(row['refused_at']),
    replyReceivedAt: parseStamp(row['reply_received_at']) ?? EPOCH,
    replyText: String(row['reply_text']),
    sentAt: parseStamp(row['sent_at']),
    signatureName: text(row['signature_name']),
    startedAt: parseStamp(row['started_at']) ?? EPOCH,
    target: isBatch
      ? { id: Number(batchId), kind: 'artworks' }
      : { id: Number(row['clause_id']), kind: 'articles' },
    text: String(row['text']),
  }
}

/*
 * A card's reply, its state and who the answer goes to, read the same way for both kinds.
 * `isInQueue` is what `13a` holds; `isApproved` an exact „Souhlasím“ the job archives on its own
 * or a conversation it already did.
 */
type Card = {
  isApproved: boolean
  isClosed: boolean
  isInQueue: boolean
  issueName: string
  recipient: AnswerRecipient
  replyMessageId: string | null
  replyReceivedAt: Temporal.Instant | null
  replyText: string
}

async function batchCard(db: Database, id: number): Promise<Card | null> {
  let result = await db.exec(
    sql`SELECT b.*, coalesce(ar.name, g.name) AS holder_name, i.name AS issue_name,
          i.closed_at AS issue_closed_at
        FROM artwork_batches b
        LEFT JOIN articles ar ON ar.id = b.article_id
        LEFT JOIN artwork_groups g ON g.id = b.group_id
        JOIN issues i ON i.id = b.issue_id
        WHERE b.id = ${id} AND b.created_at IS NOT NULL
          AND (ar.id IS NULL OR ar.removed_at IS NULL)`,
  )
  let row = result.rows?.[0]
  if (row === undefined) return null
  let status = {
    answeredAt: answeredAtOf(row),
    approvedAt: parseStamp(row['approved_at']),
    archiveFailedAt: parseStamp(row['archive_failed_at']),
    consentVerifiedAt: parseStamp(row['consent_verified_at']),
    discardedAt: parseStamp(row['discarded_at']),
    isExactConsent: Number(row['is_exact_consent']) === 1,
    mailRefusedAt: parseStamp(row['mail_refused_at']),
    mailSentAt: parseStamp(row['mail_sent_at']),
    replyMessageId: text(row['reply_message_id']),
    replyText: text(row['reply_text']),
  }
  let issueName = String(row['issue_name'])
  return {
    isApproved:
      status.approvedAt !== null || (status.isExactConsent && status.discardedAt === null),
    isClosed: row['issue_closed_at'] !== null,
    isInQueue: batchState({ ...status, answeredAt: null }) === 'review',
    issueName,
    recipient: {
      email: String(row['provider_email']),
      issueName,
      name: String(row['provider_name']),
      subject: consentSubject(
        {
          kind: row['group_id'] == null ? 'article' : 'group',
          name: String(row['holder_name']),
        },
        issueName,
        String(row['tag']),
      ),
    },
    replyMessageId: status.replyMessageId,
    replyReceivedAt: parseStamp(row['reply_received_at']),
    replyText: status.replyText ?? '',
  }
}

async function clauseCard(db: Database, id: number): Promise<Card | null> {
  let result = await db.exec(
    sql`SELECT c.*, a.name AS article_name, i.name AS issue_name, i.closed_at AS issue_closed_at,
          f.cancelled_at IS NULL AND f.replaced_at IS NULL AS is_standing
        FROM article_clauses c
        JOIN final_versions f ON f.id = c.final_version_id
        JOIN articles a ON a.id = c.article_id
        JOIN issues i ON i.id = a.issue_id
        WHERE c.id = ${id}`,
  )
  let row = result.rows?.[0]
  if (row === undefined) return null
  let state = String(row['state'])
  let status: ClauseStatus = {
    answeredAt: null,
    approvedAt: parseStamp(row['approved_at']),
    archiveFailedAt: parseStamp(row['archive_failed_at']),
    consentVerifiedAt: parseStamp(row['consent_verified_at']),
    isExactConsent: Number(row['is_exact_consent']) === 1,
    replyMessageId: text(row['reply_message_id']),
    state: state === 'failed' || state === 'sent' ? state : 'pending',
  }
  let issueName = String(row['issue_name'])
  let articleName = String(row['article_name'])
  return {
    isApproved: status.approvedAt !== null || status.isExactConsent,
    isClosed: row['issue_closed_at'] !== null,
    isInQueue: Number(row['is_standing']) === 1 && clauseState(status) === 'review',
    issueName,
    recipient: {
      email: String(row['author_email']),
      issueName,
      name: String(row['author_name']),
      subject: `${APPROVAL_SUBJECT_PREFIX} „${articleName}“ – ${issueName} [${String(row['clause_key'])}]`,
    },
    replyMessageId: status.replyMessageId,
    replyReceivedAt: parseStamp(row['reply_received_at']),
    replyText: text(row['reply_text']) ?? '',
  }
}

function cardOf(db: Database, target: AnswerTarget): Promise<Card | null> {
  return target.kind === 'articles' ? clauseCard(db, target.id) : batchCard(db, target.id)
}

const OWNERS = { articles: sql`clause_id`, artworks: sql`batch_id` } as const
const TARGETS = { articles: sql`article_clauses`, artworks: sql`artwork_batches` } as const

async function answerTo(
  db: Database,
  target: AnswerTarget,
  messageId: string,
): Promise<AnswerRow | null> {
  let result = await db.exec(
    sql`SELECT * FROM consent_answers
        WHERE ${OWNERS[target.kind]} = ${target.id} AND in_reply_to_message_id = ${messageId}`,
  )
  let row = result.rows?.[0]
  return row === undefined ? null : toAnswer(row)
}

/**
 * Why a card cannot take an answer to `messageId` now, or `null` when it can. Read in order: a
 * closed issue beats everything (`12h`), then a consent the job archives, then a card that left
 * the queue, then a newer reply.
 */
function refusalOf(card: Card | null, messageId: string): StartAnswerOutcome | null {
  if (card === null) return { kind: 'gone', recipient: null }
  let { recipient } = card
  if (card.isClosed) return { kind: 'closed', recipient }
  if (card.isApproved) return { kind: 'approved', recipient }
  if (card.replyMessageId !== null && card.replyMessageId !== messageId) {
    return { kind: 'newer-reply', recipient }
  }
  if (!card.isInQueue) return { kind: 'gone', recipient }
  return null
}

export function createAnswerStore(database: Database): AnswerStore {
  return {
    async answersOf(kind, ids) {
      let byCard = new Map<number, AnswerRow[]>()
      if (ids.length === 0) return byCard
      let result = await database.exec(
        sql`SELECT * FROM consent_answers
            WHERE ${OWNERS[kind]} IN (SELECT value FROM json_each(${JSON.stringify(ids)}))
            ORDER BY started_at DESC, id DESC`,
      )
      for (let row of result.rows ?? []) {
        let answer = toAnswer(row)
        byCard.set(answer.target.id, [...(byCard.get(answer.target.id) ?? []), answer])
      }
      return byCard
    },

    async discard(id) {
      await database.exec(
        sql`DELETE FROM consent_answers
            WHERE id = ${id} AND sent_at IS NULL AND failed_at IS NULL AND refused_at IS NULL`,
      )
    },

    mark(id, outcome, at) {
      return database.transaction(async (db) => {
        let result = await db.exec(sql`SELECT * FROM consent_answers WHERE id = ${id}`)
        let row = result.rows?.[0]
        if (row === undefined) return
        let answer = toAnswer(row)
        /* An outcome already final stays: a send that went is not undone by an attempt that
           overlapped it and failed, nor a refusal by one that went. */
        if (answer.sentAt !== null || answer.refusedAt !== null) return
        if (outcome === 'sent') {
          await db.exec(
            sql`UPDATE consent_answers SET sent_at = ${stamp(at)}, failed_at = NULL
                WHERE id = ${id}`,
          )
          await db.exec(
            sql`UPDATE ${TARGETS[answer.target.kind]}
                SET answered_message_id = ${answer.inReplyToMessageId}, answered_at = ${stamp(at)}
                WHERE id = ${answer.target.id}`,
          )
        } else if (outcome === 'refused') {
          await db.exec(
            sql`UPDATE consent_answers SET refused_at = ${stamp(at)}, failed_at = NULL
                WHERE id = ${id}`,
          )
        } else {
          await db.exec(sql`UPDATE consent_answers SET failed_at = ${stamp(at)} WHERE id = ${id}`)
        }
      })
    },

    resume(target, answerId, at) {
      return database.transaction(async (db) => {
        let result = await db.exec(sql`SELECT * FROM consent_answers WHERE id = ${answerId}`)
        let row = result.rows?.[0]
        if (row === undefined) return { kind: 'gone', recipient: null }
        let answer = toAnswer(row)
        if (answer.target.kind !== target.kind || answer.target.id !== target.id) {
          return { kind: 'gone', recipient: null }
        }
        let card = await cardOf(db, target)
        let refusal = refusalOf(card, answer.inReplyToMessageId)
        if (refusal !== null || card === null) return refusal ?? { kind: 'gone', recipient: null }
        if (answer.sentAt !== null) return { answer, kind: 'taken', recipient: card.recipient }
        if (answer.refusedAt !== null || isInFlight(answer, at)) {
          return { answer, kind: 'locked', recipient: card.recipient }
        }
        return { answer, kind: 'started', recipient: card.recipient }
      })
    },

    start(target, input, at) {
      return database.transaction(async (db) => {
        let card = await cardOf(db, target)
        let refusal = refusalOf(card, input.messageId)
        if (refusal !== null || card === null) return refusal ?? { kind: 'gone', recipient: null }
        let existing = await answerTo(db, target, input.messageId)
        if (existing !== null) {
          let kind = existing.sentAt === null ? ('locked' as const) : ('taken' as const)
          return { answer: existing, kind, recipient: card.recipient }
        }
        let receivedAt = card.replyReceivedAt ?? at
        await db.exec(
          sql`INSERT INTO consent_answers (${OWNERS[target.kind]}, in_reply_to_message_id,
                reply_received_at, reply_text, text, signature_name, editor_email, editor_name,
                idempotency_key, started_at)
              VALUES (${target.id}, ${input.messageId}, ${stamp(receivedAt)}, ${card.replyText},
                ${input.text}, ${input.signatureName}, ${input.editor.email},
                ${input.editor.displayName},
                ${answerIdempotencyKey(target.kind, target.id, input.messageId)}, ${stamp(at)})`,
        )
        let answer = await answerTo(db, target, input.messageId)
        if (answer === null) return { kind: 'gone', recipient: null }
        return { answer, kind: 'started', recipient: card.recipient }
      })
    },
  }
}
