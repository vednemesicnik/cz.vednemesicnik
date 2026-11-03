import * as Sentry from '@sentry/react-router'

import { rateLimitStore } from '~/utils/rate-limit.server'

import { createEnrolmentLink } from './create-enrolment-link'
import {
  createEnrolmentToken,
  type EnrolmentPayload,
} from './create-enrolment-token.server'
import { sendEnrolmentEmail } from './send-enrolment-email.server'

type IssueEnrolmentLinkResult =
  | { status: 'failed' | 'in-flight' | 'sent' }
  | { retryAfter: number; status: 'limited' }

// Protects a mailbox from someone else's form, where the route's limit per IP protects
// the script. It counts attempts: after a lost answer the e-mail may have gone out.
const EMAIL_LIMIT = 5
const EMAIL_WINDOW_MILLISECONDS = 60 * 60 * 1000

// Addresses with a link on its way. Another request for one adds nothing: its new token
// would kill the link in the mail still being sent, and that mail may arrive last. It
// relies on one machine, as sign-in does (log 0062).
const emailsInFlight = new Set<string>()

/**
 * Stores the pending enrolment and mails its link: what the form's action waits for.
 *
 * @param email - The address, normalised by the caller.
 * @param payload - What the confirmation needs.
 * @returns `sent`; `in-flight` when a link for this address is on its way; `limited`
 *   with the seconds left past the limit; `failed` when the row could not be stored or
 *   the e-mail may not have gone out. Never throws; failures are logged and reported to
 *   Sentry.
 */
export const issueEnrolmentLink = async (
  email: string,
  payload: EnrolmentPayload,
): Promise<IssueEnrolmentLinkResult> => {
  if (emailsInFlight.has(email)) return { status: 'in-flight' }

  emailsInFlight.add(email)

  try {
    const limit = await rateLimitStore.hit(
      `editorial-board-enrolment-email:${email}`,
      EMAIL_LIMIT,
      EMAIL_WINDOW_MILLISECONDS,
    )

    if (!limit.ok) {
      return {
        retryAfter: Math.max(0, Math.ceil((limit.resetAt - Date.now()) / 1000)),
        status: 'limited',
      }
    }

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
  } finally {
    emailsInFlight.delete(email)
  }
}
