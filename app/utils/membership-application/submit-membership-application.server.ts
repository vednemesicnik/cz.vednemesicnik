/**
 * Submits one membership application to the Google Apps Script web app bound to
 * the applications sheet (see the SCRIPT__Membership__Applications repo). The
 * script stores the row and the signed declaration on the shared drive, then
 * sends the acknowledgement to the applicant and the notice to the chair.
 *
 * Unlike the account notices this is not best-effort: the applicant must never
 * be told "sent" when it was not (#396), so the result says whether the
 * application is stored. It never throws; failures are logged and reported to
 * Sentry.
 *
 * The request is **signed** with GAS_MEMBERSHIP_SECRET (see
 * `sign-gas-request.server.ts`), which never travels. The application `code` is
 * the idempotency key: a retry with the same code stores nothing twice and
 * mails nobody twice.
 *
 * No-ops when GAS_MEMBERSHIP_URL / GAS_MEMBERSHIP_SECRET are unset outside
 * production, so the flow can be exercised without a live deployment.
 */

import type {
  Envelope,
  MembershipResponse,
  SubmitApplicationRequest,
} from '@generated/membership/response'
import * as Sentry from '@sentry/react-router'

import { postGasRequest } from '~/utils/post-gas-request.server'
import { signGasRequest } from '~/utils/sign-gas-request.server'

// An 8 MB scan is ~10.7 MB once base64-encoded, and the script files it on
// Drive before it answers.
const SUBMIT_TIMEOUT_MILLISECONDS = 60_000

export type MembershipApplicationResult =
  | {
      ok: true
      code: string
      /** False when the application is stored but its acknowledgement e-mail failed. */
      acknowledgementSent: boolean
    }
  | {
      ok: false
      /**
       * `unavailable` — not reached, timed out or failed on the far side; trying
       * again later may work. `rejected` — the script refused the request as it is.
       */
      reason: 'unavailable' | 'rejected'
    }

const REJECTED_ERRORS = new Set([
  'invalid_request',
  'missing_fields',
  'invalid_email',
  'invalid_declaration',
  'unauthorized',
  'stale_timestamp',
])

/**
 * @param request - One application; `code` is its idempotency key.
 * @returns Whether the application is stored, and whether the applicant was
 *   told by e-mail; never throws.
 */
export const submitMembershipApplication = async (
  request: SubmitApplicationRequest,
): Promise<MembershipApplicationResult> => {
  const url = process.env.GAS_MEMBERSHIP_URL
  const secret = process.env.GAS_MEMBERSHIP_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[membership] GAS_MEMBERSHIP_URL/SECRET not set — application not stored.',
      )
      return { ok: false, reason: 'unavailable' }
    }

    // Local dev without a GAS deployment: log, so the flow is usable end to end
    // without storing anyone's details anywhere.
    console.info(
      `[membership] GAS not configured — application ${request.code} not stored.`,
    )
    return { acknowledgementSent: true, code: request.code, ok: true }
  }

  try {
    const { ok, status, data } = await postGasRequest<MembershipResponse>(
      url,
      // `satisfies Envelope` ties the envelope this builds to the shape the script
      // publishes, so the two cannot drift apart without the build saying so.
      signGasRequest(secret, request) satisfies Envelope,
      { timeoutMilliseconds: SUBMIT_TIMEOUT_MILLISECONDS },
    )

    if (ok && data?.ok === true) {
      if (data.mailerError) {
        console.error(
          `[membership] ${data.code} stored, acknowledgement failed — mailerError ${data.mailerError}.`,
        )
        if (process.env.SENTRY_DSN) {
          Sentry.captureMessage('[membership] acknowledgement failed', {
            extra: { mailerError: data.mailerError },
            fingerprint: ['membership', 'acknowledgement-failed'],
            level: 'warning',
          })
        }
      }
      return {
        acknowledgementSent: data.mailerError === undefined,
        code: data.code,
        ok: true,
      }
    }

    // data is null when the body isn't JSON (e.g. a GAS HTML error page).
    const error = data?.ok === false ? data.error : undefined
    console.error(
      `[membership] GAS submit failed — status ${status}, error ${error ?? '—'}.`,
    )
    // Fly logs are short-lived; Sentry keeps failures diagnosable. A stable
    // message + fingerprint groups a sustained outage into one issue.
    if (process.env.SENTRY_DSN) {
      Sentry.captureMessage('[membership] GAS submit failed', {
        extra: { error, ok: data?.ok, status },
        fingerprint: ['membership', 'gas-submit-failed'],
        level: 'error',
      })
    }

    return {
      ok: false,
      reason: error && REJECTED_ERRORS.has(error) ? 'rejected' : 'unavailable',
    }
  } catch (error) {
    console.error('[membership] GAS request threw —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)
    return { ok: false, reason: 'unavailable' }
  }
}
