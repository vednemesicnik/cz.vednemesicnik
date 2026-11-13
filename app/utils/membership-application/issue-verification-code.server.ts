import * as Sentry from '@sentry/react-router'

import { VERIFICATION_LIMIT_WINDOW_MILLISECONDS } from '~/config/email-verification-config'
import {
  VERIFICATION_SENDS_PER_ADDRESS,
  VERIFICATION_SENDS_PER_IP,
} from '~/config/membership-application-config'
import { createVerificationCode } from '~/utils/email-verification/create-verification-code.server'
import { getRateLimitSubject } from '~/utils/get-rate-limit-subject.server'
import { getClientIp, rateLimitStore } from '~/utils/rate-limit.server'

import { sendVerificationCodeEmail } from './send-verification-code-email.server'

export type IssueVerificationCodeResult =
  | { issuedAt: number; status: 'sent' }
  | { retryAfter: number; status: 'limited' }
  | { status: 'failed' }

// Addresses with a code on its way. Another request for one makes no code of its
// own, which would race the first one to the mailbox and could arrive first. It
// waits and shares the answer, `issuedAt` included, so both cookies hold the code
// that was sent. It relies on one machine, as sign-in does (log 0062).
const issuesInFlight = new Map<string, Promise<IssueVerificationCodeResult>>()

const secondsUntil = (resetAt: number) =>
  Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))

const issue = async (
  email: string,
  clientIp: string,
): Promise<IssueVerificationCodeResult> => {
  try {
    // Both count attempts: after a lost answer the e-mail may have gone out.
    const ipLimit = await rateLimitStore.hit(
      `membership-verification-ip:${getRateLimitSubject(clientIp)}`,
      VERIFICATION_SENDS_PER_IP,
      VERIFICATION_LIMIT_WINDOW_MILLISECONDS,
    )
    if (!ipLimit.ok) {
      return { retryAfter: secondsUntil(ipLimit.resetAt), status: 'limited' }
    }

    const addressLimit = await rateLimitStore.hit(
      `membership-verification-email:${email}`,
      VERIFICATION_SENDS_PER_ADDRESS,
      VERIFICATION_LIMIT_WINDOW_MILLISECONDS,
    )
    if (!addressLimit.ok) {
      return {
        retryAfter: secondsUntil(addressLimit.resetAt),
        status: 'limited',
      }
    }

    const secret = process.env.MEMBERSHIP_VERIFICATION_SECRET ?? ''
    if (secret === '') {
      console.warn(
        '[membership] MEMBERSHIP_VERIFICATION_SECRET not set — no code made.',
      )
      return { status: 'failed' }
    }

    const issuedAt = Date.now()
    const code = createVerificationCode({
      email,
      issuedAt,
      purpose: 'membership-verify',
      secret,
    })
    const isSent = await sendVerificationCodeEmail({ code, email })

    return isSent ? { issuedAt, status: 'sent' } : { status: 'failed' }
  } catch (error) {
    console.error('[membership] issuing the verification code failed —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)

    return { status: 'failed' }
  }
}

/**
 * Makes a verification code for `email` and mails it, within the limits per IP
 * and per address. Nothing is stored: the caller writes `issuedAt` into the
 * cookie, and only then does the code work.
 *
 * @param email - The address, normalised by the caller (lower case).
 * @param request - The request, for the client's IP.
 * @returns `sent` with the moment the code was made for; `limited` with the
 *   seconds left past a limit; `failed` when the e-mail may not have gone out
 *   (a code that did arrive then never verifies). Never throws.
 */
export const issueVerificationCode = (
  email: string,
  request: Request,
): Promise<IssueVerificationCodeResult> => {
  const running = issuesInFlight.get(email)

  if (running !== undefined) return running

  const issuing = issue(email, getClientIp(request)).finally(() => {
    issuesInFlight.delete(email)
  })

  issuesInFlight.set(email, issuing)

  return issuing
}
