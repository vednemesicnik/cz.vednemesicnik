import type {
  SendVerificationCodeRequest,
  SendVerificationCodeResponse,
} from '@generated/membership/response'
import * as Sentry from '@sentry/react-router'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

// Someone is waiting on the form for this, and the script waits on the mail
// service. Two attempts stay under Cloudflare's 100 s.
const SEND_TIMEOUT_MILLISECONDS = 30_000

/**
 * Asks the membership script to mail the verification code. A transport blip
 * is tried once more, keyed by `code`: it is made for one address and moment,
 * and the script keys the mail service by it, so a retry of one request is one
 * e-mail (log 0061).
 *
 * Logs the code instead when the script is not configured outside production,
 * so the flow can be exercised without a live deployment.
 *
 * @param request - The address and the code.
 * @returns Whether the e-mail went out. After a timeout it still may have.
 *   Never throws; failures are logged and reported to Sentry.
 */
export const sendVerificationCodeEmail = async (
  request: Omit<SendVerificationCodeRequest, 'action'>,
): Promise<boolean> => {
  const url = process.env.GAS_MEMBERSHIP_URL
  const secret = process.env.GAS_MEMBERSHIP_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[membership] GAS URL/SECRET not set — no code sent.')
      return false
    }

    console.info(
      `[membership] GAS not configured — verification code for ${request.email}: ${request.code}`,
    )
    return true
  }

  const result = await postSignedGasRequest<
    Extract<SendVerificationCodeResponse, { ok: true }>,
    SendVerificationCodeRequest
  >(
    { endpoint: 'membership', secret, url },
    { ...request, action: 'sendVerificationCode' },
    {
      idempotencyKeyField: 'code',
      timeoutMilliseconds: SEND_TIMEOUT_MILLISECONDS,
    },
  )

  if (result.ok) {
    return true
  }

  const { cause, error, mailError, status } = result

  if (cause !== undefined) {
    console.error('[membership] GAS request threw —', cause)
    if (process.env.SENTRY_DSN) Sentry.captureException(cause)
    return false
  }

  console.error(
    `[membership] GAS code send failed — status ${status ?? '—'}, ` +
      `error ${error}, mailError ${mailError ?? '—'}.`,
  )

  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('[membership] GAS code send failed', {
      extra: { error, mailError, status },
      fingerprint: ['membership', 'gas-code-send-failed'],
      level: 'error',
    })
  }

  return false
}
