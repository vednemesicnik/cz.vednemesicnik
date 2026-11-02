/**
 * Sends the magic-link sign-in email through the Google Apps Script web app
 * (see the SCRIPT__Auth__Magic_Link repo) — the sign-in link and nothing else;
 * the invitation goes through `users-notice/send-users-notice.server.ts`
 * (log 0037). Best-effort: the sign-in request action returns the same
 * neutral response whether or not delivery succeeds, so this never throws —
 * failures are logged, reported to Sentry, and swallowed. It resolves to
 * whether the link went out; the identity check of a signed-in user (design
 * 29d) tells the person, sign-in never does.
 *
 * The request is **signed** rather than carrying the secret in its body, so
 * GAS_MAGIC_LINK_SECRET is a signing key and never travels — see
 * `sign-gas-request.server.ts`. The value itself did not change and nothing had to
 * be rotated. The Apps Script side accepts both shapes for one release, so this can
 * deploy and be reverted on its own; that matters here, because a mistake on this
 * path locks administrators out rather than merely failing a request.
 *
 * A transport blip is tried once more, and the idempotency key is the `link`: it is
 * minted per request, the script hashes it into the key it gives the Mailer
 * (`build-idempotency-key.gs`), so a retry of one request is one e-mail. Its contract
 * has no field for a separate key, and nothing there would read one (log 0061).
 *
 * No-ops when GAS_MAGIC_LINK_URL / GAS_MAGIC_LINK_SECRET are unset (local
 * development), so the flow can be exercised without a live GAS deployment.
 */

import type {
  SignInMagicLinkRequest,
  SignInMagicLinkResponse,
} from '@generated/magic-link/response'
import * as Sentry from '@sentry/react-router'

import { postSignedGasRequest } from './post-signed-gas-request.server'

export const sendMagicLinkEmail = async (
  request: SignInMagicLinkRequest,
): Promise<boolean> => {
  const { email, link } = request

  const url = process.env.GAS_MAGIC_LINK_URL
  const secret = process.env.GAS_MAGIC_LINK_SECRET

  if (!url || !secret) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[magic-link] GAS_MAGIC_LINK_URL/SECRET not set — skipping email send.',
      )
      return false
    }

    // Local dev without a GAS deployment: print the link so the sign-in flow
    // is usable end-to-end without sending a real email.
    console.info(`[magic-link] GAS not configured — link for ${email}: ${link}`)
    return true
  }

  const result = await postSignedGasRequest<
    Extract<SignInMagicLinkResponse, { ok: true }>,
    SignInMagicLinkRequest
  >({ endpoint: 'magic-link', secret, url }, request, {
    idempotencyKeyField: 'link',
  })

  if (result.ok) {
    return true
  }

  const { cause, error, mailerError, status } = result

  if (cause !== undefined) {
    console.error('[magic-link] GAS request threw —', cause)
    if (process.env.SENTRY_DSN) Sentry.captureException(cause)
    return false
  }

  console.error(
    `[magic-link] GAS send failed — status ${status ?? '—'}, ` +
      `error ${error}, mailerError ${mailerError ?? '—'}.`,
  )

  // Fly logs are short-lived (~5 min); report to Sentry so send failures
  // stay diagnosable. Best-effort still: no throw, nothing surfaced.
  // A stable message + fingerprint groups every failure into one issue, so
  // a sustained outage is a single issue (with the varying detail in
  // `extra`), not one per sign-in attempt.
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage('[magic-link] GAS send failed', {
      extra: { error, mailerError, status },
      fingerprint: ['magic-link', 'gas-send-failed'],
      level: 'error',
    })
  }

  return false
}
