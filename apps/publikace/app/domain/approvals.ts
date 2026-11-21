/**
 * The clauses a final version sends to its authors (#88), as `SCRIPT__Publication__Approval_Send`
 * claims them through the app's API and reports what the Mailer did with each (#89).
 */

import { RUN_LIMIT_MINUTES } from './job-run.ts'
import { stamp } from './time.ts'

/** The job, as `job_runs` names it. It joins `JOBS` once it reports (#89). */
export const APPROVAL_SEND_JOB = 'approval-send'

/** A clause claimed this recently is not handed to another run: one run lasts ten minutes at most. */
export const CLAIM_MINUTES = RUN_LIMIT_MINUTES

/** The clauses one run may take: ten authors of ten articles, with room. */
export const CLAIM_LIMIT = 100

/** More than any error text the Mailer returns; the rest is cut. */
export const ERROR_TEXT_LIMIT = 2000

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
