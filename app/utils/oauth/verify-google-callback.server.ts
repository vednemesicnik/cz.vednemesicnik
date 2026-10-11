import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import type { TokenPayload } from 'google-auth-library'

import { createGoogleOAuthClient, safeCompare } from '~/utils/oauth.server'

type GoogleCallbackResult =
  | { status: 'verified'; subject: string; email: string }
  | { status: 'failed'; error: 'oauth' | 'domain'; email?: string }

/**
 * Checks Google's answer to the OAuth round trip: the echoed state, the code
 * exchange with PKCE, the id_token signature and nonce, and the domain. Shared
 * by sign-in and the identity check (design 29d), which differ only in what
 * they do with the verified account.
 *
 * @param args.url - The callback URL Google redirected to.
 * @param args.storedState - The state kept in the vdm_oauth cookie.
 * @param args.storedNonce - The nonce kept in the vdm_oauth cookie.
 * @param args.codeVerifier - The PKCE verifier kept in the vdm_oauth cookie.
 * @returns `verified` with the Google subject and the lower-cased e-mail, or
 *   `failed` with the reason (`email` only once the domain check is reached).
 */
export const verifyGoogleCallback = async ({
  url,
  storedState,
  storedNonce,
  codeVerifier,
}: {
  url: URL
  storedState: string | undefined
  storedNonce: string | undefined
  codeVerifier: string | undefined
}): Promise<GoogleCallbackResult> => {
  // Google reports user-side failures (denied consent, etc.) via ?error.
  if (url.searchParams.get('error') !== null) {
    return { error: 'oauth', status: 'failed' }
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  // CSRF: the echoed state must match the one we stored (constant-time).
  if (
    code === null ||
    codeVerifier === undefined ||
    !safeCompare(state, storedState)
  ) {
    return { error: 'oauth', status: 'failed' }
  }

  let payload: TokenPayload | undefined
  try {
    // Inside the try: createGoogleOAuthClient throws when the Google env is
    // missing — treat that like any other OAuth failure rather than a 500.
    const client = createGoogleOAuthClient()

    const { tokens } = await client.getToken({ code, codeVerifier })

    if (!tokens.id_token) throw new Error('missing id_token')

    // verifyIdToken checks the RS256 signature against Google's JWKS and the
    // iss / aud / exp claims.
    const ticket = await client.verifyIdToken({
      audience: process.env.GOOGLE_CLIENT_ID,
      idToken: tokens.id_token,
    })

    payload = ticket.getPayload()
  } catch {
    // Do not log the raw error — it may embed the authorization code / tokens.
    console.error(
      '[google-oauth] token exchange or id_token verification failed',
    )
    return { error: 'oauth', status: 'failed' }
  }

  if (payload === undefined) return { error: 'oauth', status: 'failed' }

  // Replay guard: the id_token must carry the nonce we issued.
  if (!safeCompare(payload.nonce, storedNonce)) {
    return { error: 'oauth', status: 'failed' }
  }

  const email = payload.email?.toLowerCase()

  // Domain enforcement — three independent checks. `hd` is only trustworthy
  // because it comes from a Google-signed id_token (verified above).
  if (
    payload.email_verified !== true ||
    payload.hd !== ALLOWED_EMAIL_DOMAIN ||
    email === undefined ||
    !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
  ) {
    return { email, error: 'domain', status: 'failed' }
  }

  return { email, status: 'verified', subject: payload.sub }
}
