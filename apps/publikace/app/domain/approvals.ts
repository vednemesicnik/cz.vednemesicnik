/**
 * The clauses a final version sends to its authors (#88), as `SCRIPT__Publication__Article_Approvals`
 * claims them through the app's API, reports what the Mailer did with each, and then reports the
 * author's reply (#89).
 */

import { mayArchive } from './artwork.ts'
import { RUN_LIMIT_MINUTES } from './job-run.ts'
import { stamp } from './time.ts'
import { tied } from './public/typography.ts'

/** The job, as `job_runs` names it, and what a person reads of it (`14d`). */
export const APPROVAL_SEND_JOB = 'approval-send'
export const APPROVAL_SEND_JOB_NAME = tied`Žádosti a odpovědi u článků`

/** A clause claimed this recently is not handed to another run: one run lasts ten minutes at most. */
export const CLAIM_MINUTES = RUN_LIMIT_MINUTES

/** The clauses one run may take to send: ten authors of ten articles, with room. */
export const CLAIM_LIMIT = 100

/** The clauses one run may ask about, as many as one Reply_Check request carries. */
export const REPLY_CLAIM_LIMIT = 100

/** More than any error text the Mailer returns; the rest is cut. */
export const ERROR_TEXT_LIMIT = 2000

/**
 * The approval e-mail's subject begins with this, and the reply check searches by it. It is the
 * old job's, word for word, so one search finds the replies of both: changing it orphans every
 * clause still waiting.
 */
export const APPROVAL_SUBJECT_PREFIX = 'Žádost o potvrzení finální verze článku'

/** Written into the conversation's PDF when a person decided the reply is a consent. */
export const VERIFIED_CONSENT_NOTE = 'Odpověď autora byla ručně posouzena jako souhlas.'

export type ClauseOutcome = { error: string; kind: 'failed' } | { kind: 'sent' }

/**
 * A clause's key: the Mailer's idempotency key and the tag in the e-mail's subject, so it must be
 * unique for ever. The article, the author's place and the marking's time make it so, and carry
 * no address.
 */
export function clauseKey(articleId: number, position: number, markedAt: Temporal.Instant): string {
  let compact = stamp(markedAt).replace(/[^0-9]/g, '')
  return `clause_${articleId}_${position}_${compact}`
}

/** What the state of one clause is read from. */
export type ClauseStatus = {
  approvedAt: Temporal.Instant | null
  archiveFailedAt: Temporal.Instant | null
  consentVerifiedAt: Temporal.Instant | null
  /** The latest reply is exactly „Souhlasím“. */
  isExactConsent: boolean
  replyMessageId: string | null
  /** As the job reported the e-mail: `pending` is _K odeslání_. */
  state: 'failed' | 'pending' | 'sent'
}

/**
 * Where one author's clause is, by who is on the move (the Evidence's names in brackets):
 *
 * - `pending` (_K odeslání_) waits for the next run to send it;
 * - `waiting` (_Čeká na odpověď_) was sent and nobody replied yet;
 * - `review` (_Odpověď ke kontrole_): the reply is not exactly „Souhlasím“, and the editors-in-chief
 *   decide in _Ke kontrole_ (`13a`);
 * - `verified` (_Souhlas k archivaci_): a consent, exact or decided, whose conversation the next
 *   run archives;
 * - `approved` (_Souhlas udělen_): the conversation is in `Licence`;
 * - `unsent` (_Chyba_): the Mailer did not confirm the e-mail;
 * - `unarchived` (_Chyba_): the consent stands, its archive failed, and the next run tries again.
 *
 * A reply beats an e-mail the Mailer did not confirm: a copy that arrived after all was read, so
 * the consent in it is not lost (`viipe3q8`, as for artworks).
 */
export type ClauseState =
  | 'approved'
  | 'pending'
  | 'review'
  | 'unarchived'
  | 'unsent'
  | 'verified'
  | 'waiting'

export function clauseState(clause: ClauseStatus): ClauseState {
  if (clause.approvedAt !== null) return 'approved'
  if (clause.state === 'pending') return 'pending'
  if (clause.archiveFailedAt !== null) return 'unarchived'
  if (clause.replyMessageId !== null) {
    return mayArchive({ ...clause, discardedAt: null }) ? 'verified' : 'review'
  }
  return clause.state === 'failed' ? 'unsent' : 'waiting'
}

/** The clauses of one final version, counted by state. */
export type ClauseCounts = Readonly<Record<ClauseState, number>> & { total: number }

export function countClauses(clauses: readonly ClauseStatus[]): ClauseCounts {
  let counts: Record<ClauseState, number> = {
    approved: 0,
    pending: 0,
    review: 0,
    unarchived: 0,
    unsent: 0,
    verified: 0,
    waiting: 0,
  }
  for (let clause of clauses) counts[clauseState(clause)] += 1
  return { ...counts, total: clauses.length }
}
