import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

import { OAuth2Client } from 'google-auth-library'
import {
  createCookie,
  createCookieSessionStorage,
  type Session,
} from 'react-router'

// --- Google client --------------------------------------------------------

// Path of the OAuth callback; the full redirect URI is derived from BASE_URL so
// it always matches the deployment (and the URI registered in Google Console).
export const GOOGLE_CALLBACK_PATH = '/administration/sign-in/google/callback'

export const GOOGLE_OAUTH_SCOPES = ['openid', 'email', 'profile']

/**
 * Builds a Google OAuth2 client from the environment. `GOOGLE_CLIENT_ID` /
 * `GOOGLE_CLIENT_SECRET` are validated as optional in env.server (OAuth is not
 * required for local dev), so their presence is enforced here, at the point of
 * use — mirroring how the object stores enforce their own credentials.
 */
export const createGoogleOAuthClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      'Google OAuth is not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
    )
  }

  const redirectUri = new URL(GOOGLE_CALLBACK_PATH, process.env.BASE_URL).href

  return new OAuth2Client({ clientId, clientSecret, redirectUri })
}

// --- CSRF / PKCE / nonce material -----------------------------------------

// 32 random bytes → 256 bits, base64url — matches the token entropy used by the
// magic-link flow (magic-link.server.ts).
const randomToken = () => randomBytes(32).toString('base64url')

/**
 * Fresh per-request OAuth material:
 * - `state`   — CSRF guard, echoed back by Google and re-checked in the callback
 * - `nonce`   — id_token replay guard, embedded in the id_token by Google
 * - `codeVerifier` / `codeChallenge` — PKCE (S256)
 */
export const createOAuthRequestParams = () => {
  const codeVerifier = randomToken()
  const codeChallenge = createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

  return {
    codeChallenge,
    codeVerifier,
    nonce: randomToken(),
    state: randomToken(),
  }
}

/**
 * Constant-time compare of two secrets (state / nonce). Returns false for any
 * non-string or length mismatch, so a missing cookie value can't match.
 */
export const safeCompare = (a: unknown, b: unknown) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false

  const bufferA = Buffer.from(a)
  const bufferB = Buffer.from(b)

  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB)
}

// --- vdm_oauth cookie -----------------------------------------------------
// Carries the per-request OAuth material (and the caller's redirectTo) across
// the external round-trip to Google. Short-lived and single-use: the callback
// destroys it regardless of outcome. sameSite=lax is required — the callback is
// a top-level GET navigation from google.com, which strict would strip.

type OAuthCookieData = {
  state: string
  nonce: string
  codeVerifier: string
  redirectTo: string
}

type OAuthCookieFlashData = {
  error: string
}

type OAuthCookieSession = Session<OAuthCookieData, OAuthCookieFlashData>

const cookieSessionStorage = createCookieSessionStorage<
  OAuthCookieData,
  OAuthCookieFlashData
>({
  cookie: createCookie('vdm_oauth', {
    httpOnly: true,
    maxAge: 60 * 10, // 10 minutes — bounds the Google consent round-trip
    path: '/',
    sameSite: 'lax',
    secrets: process.env.SESSION_SECRET?.split(','),
    secure: process.env.NODE_ENV === 'production',
  }),
})

export const getOAuthCookieSession = async (request: Request) =>
  cookieSessionStorage.getSession(request.headers.get('Cookie'))

export const setOAuthCookieSession = async (
  request: Request,
  data: OAuthCookieData,
) => {
  const cookieSession = await getOAuthCookieSession(request)

  cookieSession.set('state', data.state)
  cookieSession.set('nonce', data.nonce)
  cookieSession.set('codeVerifier', data.codeVerifier)
  cookieSession.set('redirectTo', data.redirectTo)

  return cookieSessionStorage.commitSession(cookieSession)
}

export const deleteOAuthCookieSession = async (
  cookieSession: OAuthCookieSession,
) => cookieSessionStorage.destroySession(cookieSession)
