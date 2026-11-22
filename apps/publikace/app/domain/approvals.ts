/**
 * The clauses a final version sends to its authors (#88), as `SCRIPT__Publication__Article_Approvals`
 * claims them through the app's API, reports what the Mailer did with each, and then reports the
 * author's reply (#89).
 */

import { mayArchive } from './artwork.ts'
import { type JobHealth, RUN_LIMIT_MINUTES } from './job-run.ts'
import { clockTime, formatDayMonth, formatMoment, stamp } from './time.ts'
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

/**
 * The Mailer's idempotency key for one sending of a clause, which the job gets as `sendKey`. The
 * Mailer answers a key it has sent as sent without sending, so _Poslat žádost znovu_ needs a new
 * one; the first sending keeps the clause's own key, so what went before #92 keeps its key.
 */
export function sendKey(key: string, attempt: number): string {
  return attempt <= 1 ? key : `${key}_${attempt}`
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

/**
 * _Poslat žádost znovu_ (`12b`) takes a clause whose e-mail went and nobody answered, and one the
 * Mailer did not confirm. A failed archive is not among them: the consent stands, and the next
 * run archives it again. The store's `UPDATE` writes the same rule out for SQL.
 */
export function isResendable(state: ClauseState): boolean {
  return state === 'waiting' || state === 'unsent'
}

/** One author's clause as the open row of the issue detail shows it (`12b`, `12q`). */
export type ClauseDetail = {
  approvedAt: Temporal.Instant | null
  archiveError: string | null
  authorEmail: string
  authorName: string
  error: string | null
  id: number
  replyReceivedAt: Temporal.Instant | null
  replyText: string | null
  sentAt: Temporal.Instant | null
  signature: string
  state: ClauseState
}

/**
 * An author's tag in the open row and the line beside it, as the table under `12b` gives them.
 * `quote` is the reply under _Ke kontrole_, which is decided only in the queue (`13a`), so the row
 * links there; `link` names where the page links under the line. The estimate of the next run
 * only while there is one, and none for a job that stopped reporting (`14d`).
 */
export type ClauseRowTag = {
  detail: string | null
  label: string
  link: 'jobs' | 'review' | null
  quote: string | null
  tone: 'done' | 'problem' | 'running' | 'waiting'
}

export function clauseRowTag(
  clause: ClauseDetail,
  health: JobHealth,
  today: Temporal.Instant,
): ClauseRowTag {
  let tag = { detail: null, link: null, quote: null }
  switch (clause.state) {
    case 'pending':
      return {
        ...tag,
        detail:
          health.kind === 'stopped'
            ? 'úloha teď neběží'
            : health.kind === 'running' && health.next !== null
              ? `další běh kolem ${clockTime(health.next)}`
              : null,
        label: 'Čeká na odeslání',
        tone: 'running',
      }
    case 'waiting':
      return {
        ...tag,
        detail: clause.sentAt === null ? null : `od ${formatDayMonth(clause.sentAt)}`,
        label: 'Čeká na odpověď',
        tone: 'running',
      }
    case 'review':
      return {
        ...tag,
        label: 'Ke kontrole',
        link: 'review',
        quote: clause.replyText,
        tone: 'waiting',
      }
    case 'verified':
      return { ...tag, label: 'Souhlas zaznamenán', tone: 'running' }
    case 'approved': {
      /* The time of the reply the archived conversation holds, else of the archive itself. */
      let at = clause.replyReceivedAt ?? clause.approvedAt
      return {
        ...tag,
        detail: at === null ? null : formatMoment(at, today),
        label: 'Souhlasí',
        tone: 'done',
      }
    }
    case 'unsent':
      return { ...tag, detail: clause.error, label: 'Chyba', link: 'jobs', tone: 'problem' }
    case 'unarchived':
      return { ...tag, detail: clause.archiveError, label: 'Chyba', link: 'jobs', tone: 'problem' }
  }
}

/*
 * The words of the open row that `12b` does not draw, from the copywriter (`bu5a85zn`). The
 * button carries the number of its recipients once an article has more than one author, because
 * on such an article it may go to fewer of them than the row lists, as `12o` counts a batch.
 */
export function resendLabel(recipients: number, authors: number): string {
  if (authors <= 1) return 'Poslat žádost znovu'
  return `Poslat žádost znovu ${recipients} ${recipients === 1 ? 'autorovi' : 'autorům'}`
}

/** The toast after it: nothing went yet, and each author's line says when it will. */
export function resentClausesToast(recipients: number): string {
  return recipients === 1 ? 'Žádost čeká na odeslání.' : 'Žádosti čekají na odeslání.'
}

/** Somebody answered or pressed it meanwhile, or the marking is no longer the one the row showed. */
export const RESEND_NOTHING_TOAST = 'Žádnou žádost teď nelze poslat znovu.'

export function resendClosedToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Žádost už nelze poslat znovu.`
}

/** Under _Chyba_: the job's own page, where its runs and their errors are (`14e`). */
export const CLAUSE_JOB_LINK_LABEL = `Úloha ${APPROVAL_SEND_JOB_NAME}`

/** Under a reply _Ke kontrole_: its card in the queue, where it is decided (`13a`). */
export const CLAUSE_REVIEW_LINK_LABEL = 'Přejít na odpověď ke kontrole'

/** In the „⋯“ of an article _Ke kontrole_ (`12a`): it opens the row, where the reply is quoted. */
export const SHOW_REPLY_LABEL = 'Zobrazit odpověď'
