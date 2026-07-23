/**
 * Sends the magic-link sign-in email through the Google Apps Script web app
 * (see the SCRIPT__Auth__Magic_Link repo). Best-effort: the sign-in request
 * action returns the same neutral response whether or not delivery succeeds, so
 * this never throws — failures are logged, reported to Sentry, and swallowed.
 *
 * No-ops when GAS_MAGIC_LINK_URL / GAS_MAGIC_LINK_SECRET are unset (local
 * development), so the flow can be exercised without a live GAS deployment.
 */

import type {
  SignInMagicLinkRequest,
  SignInMagicLinkResponse,
} from '@generated/magic-link/response'
import * as Sentry from '@sentry/react-router'

import { postGasRequest } from './post-gas-request.server'

export const sendMagicLinkEmail = async ({
  email,
  link,
}: {
  email: string
  link: string
}) => {
  const url = process.env.GAS_MAGIC_LINK_URL
  const secret = process.env.GAS_MAGIC_LINK_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[magic-link] GAS_MAGIC_LINK_URL/SECRET not set — skipping email send.',
      )
    } else {
      // Local dev without a GAS deployment: print the link so the sign-in flow
      // is usable end-to-end without sending a real email.
      console.info(
        `[magic-link] GAS not configured — sign-in link for ${email}: ${link}`,
      )
    }
    return
  }

  try {
    const { ok, status, data } = await postGasRequest<SignInMagicLinkResponse>(
      url,
      { email, link, secret } satisfies SignInMagicLinkRequest,
    )

    if (!ok || data?.ok !== true) {
      // data is null when the body isn't JSON (e.g. a GAS HTML error page);
      // otherwise narrow to the failure branch for the error / mailerError.
      const failure = data?.ok === false ? data : undefined
      const message =
        `[magic-link] GAS send failed — status ${status}, ` +
        `ok ${data?.ok ?? '—'}, error ${failure?.error ?? '—'}, ` +
        `mailerError ${failure?.mailerError ?? '—'}.`

      console.error(message)

      // Fly logs are short-lived (~5 min); report to Sentry so send failures
      // stay diagnosable. Best-effort still: no throw, nothing surfaced.
      // A stable message + fingerprint groups every failure into one issue, so
      // a sustained outage is a single issue (with the varying detail in
      // `extra`), not one per sign-in attempt.
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage('[magic-link] GAS send failed', {
          extra: {
            error: failure?.error,
            mailerError: failure?.mailerError,
            ok: data?.ok,
            status,
          },
          fingerprint: ['magic-link', 'gas-send-failed'],
          level: 'error',
        })
      }
    }
  } catch (error) {
    console.error('[magic-link] GAS request threw —', error)
    if (process.env.SENTRY_DSN) Sentry.captureException(error)
  }
}
