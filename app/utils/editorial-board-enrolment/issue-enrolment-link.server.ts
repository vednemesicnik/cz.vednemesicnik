import * as Sentry from '@sentry/react-router'

import { rateLimitStore } from '~/utils/rate-limit.server'

import { createEnrolmentLink } from './create-enrolment-link'
import {
  createEnrolmentToken,
  type EnrolmentPayload,
} from './create-enrolment-token.server'
import { sendEnrolmentEmail } from './send-enrolment-email.server'

type IssueEnrolmentLinkResult = { status: 'failed' | 'limited' | 'sent' }

// Protects a mailbox from someone else's form, where the route's limit per IP protects
// the script. It counts attempts: after a lost answer the e-mail may have gone out.
const EMAIL_LIMIT = 5
const EMAIL_WINDOW_MILLISECONDS = 60 * 60 * 1000

// Addresses with a link on its way. Another request for one mints no token of its own,
// which would kill the link in the mail still being sent, and that mail may arrive last.
// It waits for the answer instead, so nobody reads that a link went out when the send
// then fails. It relies on one machine, as sign-in does (log 0062).
const issuesInFlight = new Map<string, Promise<IssueEnrolmentLinkResult>>()

const issue = async (
  email: string,
  payload: EnrolmentPayload,
): Promise<IssueEnrolmentLinkResult> => {
  try {
    const limit = await rateLimitStore.hit(
      `editorial-board-enrolment-email:${email}`,
      EMAIL_LIMIT,
      EMAIL_WINDOW_MILLISECONDS,
    )

    if (!limit.ok) return { status: 'limited' }

    const token = await createEnrolmentToken(email, payload)
    const link = createEnrolmentLink({
      baseUrl: process.env.BASE_URL,
      token,
    })
    const isSent = await sendEnrolmentEmail({ email, link })

    return { status: isSent ? 'sent' : 'failed' }
  } catch (error) {
    console.error('[editorial-board-enrolment] storing failed —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)

    return { status: 'failed' }
  }
}

/**
 * Stores the pending enrolment and mails its link: what the form's action waits for.
 *
 * @param email - The address, normalised by the caller.
 * @param payload - What the confirmation needs. A request that finds a link for this
 *   address on its way shares that send's answer, and its own payload is not used.
 * @returns `sent`; `limited` past the limit on the address; `failed` when the row
 *   could not be stored or the e-mail may not have gone out. Never throws; failures are
 *   logged and reported to Sentry.
 */
export const issueEnrolmentLink = (
  email: string,
  payload: EnrolmentPayload,
): Promise<IssueEnrolmentLinkResult> => {
  const running = issuesInFlight.get(email)

  if (running !== undefined) return running

  const issuing = issue(email, payload).finally(() => {
    issuesInFlight.delete(email)
  })

  issuesInFlight.set(email, issuing)

  return issuing
}
