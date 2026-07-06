import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import type { TokenPayload } from 'google-auth-library'
import { redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createGoogleOAuthClient,
  deleteOAuthCookieSession,
  getOAuthCookieSession,
  safeCompare,
} from '~/utils/oauth.server'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'

const GOOGLE_PROVIDER_NAME = 'google'

export const loader = async ({ request }: Route.LoaderArgs) => {
  // Never let an already-signed-in admin complete a callback and swap sessions.
  await requireUnauthenticated(request)

  // Read the transient OAuth material, then destroy the cookie regardless of
  // outcome — it is strictly single-use.
  const cookieSession = await getOAuthCookieSession(request)
  const destroyCookie = await deleteOAuthCookieSession(cookieSession)

  const failTo = (error: 'oauth' | 'domain' | 'account') =>
    redirect(`/administration/sign-in?error=${error}`, {
      headers: { 'Set-Cookie': destroyCookie },
    })

  const url = new URL(request.url)

  // Google reports user-side failures (denied consent, etc.) via ?error.
  if (url.searchParams.get('error') !== null) throw failTo('oauth')

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const storedState = cookieSession.get('state')
  const storedNonce = cookieSession.get('nonce')
  const codeVerifier = cookieSession.get('codeVerifier')
  const redirectTo = cookieSession.get('redirectTo')

  // CSRF: the echoed state must match the one we stored (constant-time).
  if (
    code === null ||
    codeVerifier === undefined ||
    !safeCompare(state, storedState)
  ) {
    throw failTo('oauth')
  }

  const client = createGoogleOAuthClient()

  let payload: TokenPayload | undefined
  try {
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
    throw failTo('oauth')
  }

  if (payload === undefined) throw failTo('oauth')

  // Replay guard: the id_token must carry the nonce we issued.
  if (!safeCompare(payload.nonce, storedNonce)) throw failTo('oauth')

  const email = payload.email?.toLowerCase()

  // Domain enforcement — three independent checks. `hd` is only trustworthy
  // because it comes from a Google-signed id_token (verified above).
  if (
    payload.email_verified !== true ||
    payload.hd !== ALLOWED_EMAIL_DOMAIN ||
    email === undefined ||
    !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
  ) {
    throw failTo('domain')
  }

  try {
    // Already linked → sign in that user.
    const connection = await prisma.connection.findUnique({
      select: { userId: true },
      where: {
        providerName_providerId: {
          providerId: payload.sub,
          providerName: GOOGLE_PROVIDER_NAME,
        },
      },
    })

    if (connection !== null) {
      return await signInUser(
        request,
        connection.userId,
        redirectTo,
        new Headers({ 'Set-Cookie': destroyCookie }),
      )
    }

    // First OAuth sign-in for an existing account → auto-link via verified email.
    const user = await findExistingUserByEmail(email)

    if (user === null) throw failTo('account')

    await prisma.connection.create({
      data: {
        providerId: payload.sub,
        providerName: GOOGLE_PROVIDER_NAME,
        userId: user.id,
      },
    })

    return await signInUser(
      request,
      user.id,
      redirectTo,
      new Headers({ 'Set-Cookie': destroyCookie }),
    )
  } catch (error) {
    // Re-throw redirects (signInUser / failTo('account')); only DB faults reach
    // the generic branch.
    if (error instanceof Response) throw error

    console.error('[google-oauth] failed to link or sign in the account')
    throw failTo('oauth')
  }
}
