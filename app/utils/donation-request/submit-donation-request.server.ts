import type {
  SubmitRequest,
  SubmitResponse,
} from '@generated/donation-confirmation/response'
import * as Sentry from '@sentry/react-router'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

// The script writes a row under its lock before it answers.
const SUBMIT_TIMEOUT_MILLISECONDS = 30_000

export type DonationRequestResult =
  | { ok: true }
  | {
      ok: false
      /**
       * `rejected` — the script refused the details as they are; the donor has
       * to change them. `unavailable` — not reached, timed out, or failed on our
       * side (including a wrong secret or clock); trying again later may work.
       */
      reason: 'rejected' | 'unavailable'
    }

// What the donor's own input caused. Everything else is ours.
const REJECTED_ERRORS = new Set([
  'invalid_email',
  'invalid_request',
  'missing_fields',
])

/**
 * Stores one donation request through the donation script, which writes the
 * row and acknowledges it by e-mail. Signed with
 * `GAS_DONATION_CONFIRMATION_SECRET`, which never travels; `requestId` is the
 * idempotency key, so a retry stores nothing twice and mails nobody twice.
 *
 * Logs instead of posting when the script is not configured outside
 * production, so the flow can be exercised without a live deployment.
 *
 * @param request - One request, after its address was confirmed.
 * @returns Whether the request is stored. Never throws; failures are logged
 *   and reported to Sentry.
 */
export const submitDonationRequest = async (
  request: SubmitRequest,
): Promise<DonationRequestResult> => {
  const url = process.env.GAS_DONATION_CONFIRMATION_URL
  const secret = process.env.GAS_DONATION_CONFIRMATION_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[donate] GAS URL/SECRET not set — request not stored.')
      return { ok: false, reason: 'unavailable' }
    }

    console.info(
      `[donate] GAS not configured — request ${request.requestId} not stored.`,
    )
    return { ok: true }
  }

  const result = await postSignedGasRequest<
    Extract<SubmitResponse, { ok: true }>,
    SubmitRequest
  >({ endpoint: 'donation-confirmation', secret, url }, request, {
    idempotencyKeyField: 'requestId',
    timeoutMilliseconds: SUBMIT_TIMEOUT_MILLISECONDS,
  })

  if (result.ok) {
    if (result.mailError) {
      console.error(
        `[donate] ${result.requestId} stored, acknowledgement failed — mailError ${result.mailError}.`,
      )
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage('[donate] acknowledgement failed', {
          extra: { mailError: result.mailError },
          fingerprint: ['donate', 'acknowledgement-failed'],
          level: 'warning',
        })
      }
    }
    return { ok: true }
  }

  const { cause, error, status } = result

  if (cause !== undefined) {
    console.error('[donate] GAS request threw —', cause)
    if (process.env.SENTRY_DSN) Sentry.captureException(cause)
    return { ok: false, reason: 'unavailable' }
  }

  console.error(
    `[donate] GAS submit failed — status ${status ?? '—'}, error ${error}.`,
  )
  // Fly logs are short-lived; Sentry keeps failures diagnosable. A stable
  // message + fingerprint groups a sustained outage into one issue.
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('[donate] GAS submit failed', {
      extra: { error, status },
      fingerprint: ['donate', 'gas-submit-failed'],
      level: 'error',
    })
  }

  return {
    ok: false,
    reason: REJECTED_ERRORS.has(error) ? 'rejected' : 'unavailable',
  }
}
