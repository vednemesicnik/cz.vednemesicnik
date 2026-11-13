import * as Sentry from '@sentry/react-router'

import {
  VERIFICATION_LIMIT_WINDOW_MILLISECONDS,
  type VerificationPurpose,
} from '~/config/email-verification-config'
import { getRateLimitSubject } from '~/utils/get-rate-limit-subject.server'
import { getClientIp, rateLimitStore } from '~/utils/rate-limit.server'

import { createVerificationCode } from './create-verification-code.server'

export type IssueVerificationCodeResult =
  | { issuedAt: number; status: 'sent' }
  | { retryAfter: number; status: 'limited' }
  | { status: 'failed' }

type IssueVerificationCodeOptions = {
  /** The address, normalised by the caller (lower case). */
  email: string
  /** Sends an hour: per IP, protecting the script, and per address,
   * protecting a mailbox from someone else's form (log 0066). */
  limits: { sendsPerAddress: number; sendsPerIp: number }
  purpose: VerificationPurpose
  /** The request, for the client's IP. */
  request: Request
  /** The form's own verification secret. */
  secret: string
  /** Mails the code; answers whether it went out, never throws. */
  sendCode: (message: { code: string; email: string }) => Promise<boolean>
}

// Addresses with a code on its way, per purpose. Another request for one makes
// no code of its own, which would race the first one to the mailbox and could
// arrive first. It waits and shares the answer, `issuedAt` included, so both
// cookies hold the code that was sent. It relies on one machine, as sign-in
// does (log 0062).
const issuesInFlight = new Map<string, Promise<IssueVerificationCodeResult>>()

const secondsUntil = (resetAt: number) =>
  Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))

const issue = async ({
  email,
  limits,
  purpose,
  request,
  secret,
  sendCode,
}: IssueVerificationCodeOptions): Promise<IssueVerificationCodeResult> => {
  try {
    // Both count attempts: after a lost answer the e-mail may have gone out.
    const ipLimit = await rateLimitStore.hit(
      `${purpose}-ip:${getRateLimitSubject(getClientIp(request))}`,
      limits.sendsPerIp,
      VERIFICATION_LIMIT_WINDOW_MILLISECONDS,
    )
    if (!ipLimit.ok) {
      return { retryAfter: secondsUntil(ipLimit.resetAt), status: 'limited' }
    }

    const addressLimit = await rateLimitStore.hit(
      `${purpose}-email:${email}`,
      limits.sendsPerAddress,
      VERIFICATION_LIMIT_WINDOW_MILLISECONDS,
    )
    if (!addressLimit.ok) {
      return {
        retryAfter: secondsUntil(addressLimit.resetAt),
        status: 'limited',
      }
    }

    if (secret === '') {
      console.warn(`[${purpose}] verification secret not set — no code made.`)
      return { status: 'failed' }
    }

    const issuedAt = Date.now()
    const code = createVerificationCode({ email, issuedAt, purpose, secret })
    const isSent = await sendCode({ code, email })

    return isSent ? { issuedAt, status: 'sent' } : { status: 'failed' }
  } catch (error) {
    console.error(`[${purpose}] issuing the verification code failed —`, error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)

    return { status: 'failed' }
  }
}

/**
 * Makes a verification code for an address and mails it, within the limits per
 * IP and per address. Nothing is stored: the caller writes `issuedAt` into its
 * cookie, and only then does the code work.
 *
 * @param options - The address, the form's purpose, secret, limits and sender,
 *   and the request.
 * @returns `sent` with the moment the code was made for; `limited` with the
 *   seconds left past a limit; `failed` when the e-mail may not have gone out
 *   (a code that did arrive then never verifies). Never throws.
 */
export const issueVerificationCode = (
  options: IssueVerificationCodeOptions,
): Promise<IssueVerificationCodeResult> => {
  const key = `${options.purpose}:${options.email}`
  const running = issuesInFlight.get(key)

  if (running !== undefined) return running

  const issuing = issue(options).finally(() => {
    issuesInFlight.delete(key)
  })

  issuesInFlight.set(key, issuing)

  return issuing
}
