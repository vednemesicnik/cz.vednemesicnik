/**
 * Sends a notice to an administration user about their account through the
 * Google Apps Script web app (see the SCRIPT__Users__Notice_Send repo): the
 * invitation of a new user (design 29e) or the notice of an e-mail change to
 * the old address (28f). Best-effort: it never throws;
 * failures are logged, reported to Sentry, and swallowed, and it resolves to
 * whether the notice went out, for the caller to tell the person (28e).
 *
 * The request is **signed** with GAS_USERS_NOTICE_SECRET (see
 * `sign-gas-request.server.ts`), which never travels. The script sends through
 * the notifications mailbox's Mailer; `SCRIPT__Auth__Magic_Link` sends only the
 * sign-in link (decision 0037).
 *
 * No-ops when GAS_USERS_NOTICE_URL / GAS_USERS_NOTICE_SECRET are unset (local
 * development), so the flow can be exercised without a live GAS deployment.
 */

import type {
  EmailChangeNoticeRequest,
  Envelope,
  InvitationRequest,
  UsersNoticeResponse,
} from '@generated/users-notice/response'
import * as Sentry from '@sentry/react-router'

import { postGasRequest } from '~/utils/post-gas-request.server'
import { signGasRequest } from '~/utils/sign-gas-request.server'

/**
 * @param request - One notice, discriminated by `kind`.
 * @returns Whether the notice went out; never throws.
 */
export const sendUsersNotice = async (
  request: InvitationRequest | EmailChangeNoticeRequest,
): Promise<boolean> => {
  const url = process.env.GAS_USERS_NOTICE_URL
  const secret = process.env.GAS_USERS_NOTICE_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[users-notice] GAS_USERS_NOTICE_URL/SECRET not set — skipping the notice.',
      )
      return false
    }

    // Local dev without a GAS deployment: print the notice so the flow is
    // usable end-to-end without sending a real email.
    const detail =
      request.kind === 'invitation'
        ? request.link
        : `${request.newEmail} by ${request.changedByName}`
    console.info(
      `[users-notice] GAS not configured — ${request.kind} for ${request.email}: ${detail}`,
    )
    return true
  }

  try {
    const { ok, status, data } = await postGasRequest<UsersNoticeResponse>(
      url,
      // `satisfies Envelope` ties the envelope this builds to the shape the script
      // publishes, so the two cannot drift apart without the build saying so.
      signGasRequest(secret, request) satisfies Envelope,
    )

    if (!ok || data?.ok !== true) {
      // data is null when the body isn't JSON (e.g. a GAS HTML error page);
      // otherwise narrow to the failure branch for the error / mailerError.
      const failure = data?.ok === false ? data : undefined
      const message =
        `[users-notice] GAS send failed — ${request.kind}, status ${status}, ` +
        `ok ${data?.ok ?? '—'}, error ${failure?.error ?? '—'}, ` +
        `mailerError ${failure?.mailerError ?? '—'}.`

      console.error(message)

      // Fly logs are short-lived; Sentry keeps send failures diagnosable. A stable
      // message + fingerprint groups a sustained outage into one issue.
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage('[users-notice] GAS send failed', {
          extra: {
            error: failure?.error,
            kind: request.kind,
            mailerError: failure?.mailerError,
            ok: data?.ok,
            status,
          },
          fingerprint: ['users-notice', 'gas-send-failed'],
          level: 'error',
        })
      }
      return false
    }

    return true
  } catch (error) {
    console.error('[users-notice] GAS request threw —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)
    return false
  }
}
