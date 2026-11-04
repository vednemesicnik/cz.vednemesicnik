import type {
  EditorialBoardMembershipResponse,
  SendEnrolmentEmailRequest,
} from '@generated/editorial-board-membership/response'
import * as Sentry from '@sentry/react-router'

import { postSignedGasRequest } from '~/utils/post-signed-gas-request.server'

// Someone is waiting on the form for this, and the script waits on the Mailer. Two
// attempts stay under Cloudflare's 100 s.
const SEND_TIMEOUT_MILLISECONDS = 30_000

/**
 * Asks the script to mail the confirmation link. A transport blip is tried once more,
 * keyed by `link`: it is minted per submission and the script hashes it into the
 * Mailer's key, so a retry of one request is one e-mail (log 0061).
 *
 * Logs the link instead when the script is not configured outside production, so the
 * flow can be exercised without a live deployment.
 *
 * @param request - The address and the link.
 * @returns Whether the e-mail went out. After a timeout it still may have. Never
 *   throws; failures are logged and reported to Sentry.
 */
export const sendEnrolmentEmail = async (
  request: Omit<SendEnrolmentEmailRequest, 'action'>,
): Promise<boolean> => {
  const url = process.env.GAS_EDITORIAL_BOARD_MEMBERSHIP_URL
  const secret = process.env.GAS_EDITORIAL_BOARD_MEMBERSHIP_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[editorial-board-enrolment] GAS URL/SECRET not set — nothing sent.',
      )
      return false
    }

    console.info(
      `[editorial-board-enrolment] GAS not configured — link for ${request.email}: ${request.link}`,
    )
    return true
  }

  const result = await postSignedGasRequest<
    Extract<EditorialBoardMembershipResponse, { ok: true }>,
    SendEnrolmentEmailRequest
  >(
    { endpoint: 'editorial-board-membership', secret, url },
    { ...request, action: 'sendEnrolmentEmail' },
    {
      idempotencyKeyField: 'link',
      timeoutMilliseconds: SEND_TIMEOUT_MILLISECONDS,
    },
  )

  if (result.ok) {
    return true
  }

  const { cause, error, mailerError, status } = result

  if (cause !== undefined) {
    console.error('[editorial-board-enrolment] GAS request threw —', cause)
    if (process.env.SENTRY_DSN) Sentry.captureException(cause)
    return false
  }

  console.error(
    `[editorial-board-enrolment] GAS send failed — status ${status ?? '—'}, ` +
      `error ${error}, mailerError ${mailerError ?? '—'}.`,
  )

  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('[editorial-board-enrolment] GAS send failed', {
      extra: { error, mailerError, status },
      fingerprint: ['editorial-board-enrolment', 'gas-send-failed'],
      level: 'error',
    })
  }

  return false
}
