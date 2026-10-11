import { redirect } from 'react-router'
import { GOOGLE_PROVIDER_NAME } from '~/config/connection-config'
import { requireUnauthenticated } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { prisma } from '~/utils/db.server'
import { verifyGoogleCallback } from '~/utils/oauth/verify-google-callback.server'
import {
  deleteOAuthCookieSession,
  getOAuthCookieSession,
} from '~/utils/oauth.server'
import { findExistingUserByEmail, signInUser } from '~/utils/sign-in.server'

import type { Route } from './+types/route'
import { verifyIdentityWithGoogle } from './utils/verify-identity-with-google.server'

export const loader = async ({ request }: Route.LoaderArgs) => {
  // Read the transient OAuth material, then destroy the cookie regardless of
  // outcome — it is strictly single-use.
  const cookieSession = await getOAuthCookieSession(request)
  const destroyCookie = await deleteOAuthCookieSession(cookieSession)

  const storedState = cookieSession.get('state')
  const storedNonce = cookieSession.get('nonce')
  const codeVerifier = cookieSession.get('codeVerifier')
  const redirectTo = cookieSession.get('redirectTo')

  // The identity check of a signed-in user (design 29d) shares the registered
  // callback URL; it marks the current session instead of signing in.
  if (cookieSession.get('purpose') === 'verify-identity') {
    return verifyIdentityWithGoogle({
      destroyCookie,
      oauth: { codeVerifier, redirectTo, storedNonce, storedState },
      request,
    })
  }

  // Never let an already-signed-in admin complete a callback and swap sessions.
  await requireUnauthenticated(request)

  // Preserve the original redirectTo across the error bounce, so retrying sign-in
  // still returns the user to where they started. (It was sanitized on the way
  // in; the sign-in loader re-validates it via safeRedirect.)
  // Every failure path funnels through here, so record the audit row once in one
  // place. `email` is only known past the domain check; earlier OAuth-stage
  // failures (denied consent, bad state/nonce, token exchange) log without it.
  const failTo = (error: 'oauth' | 'domain' | 'account', email?: string) => {
    recordAuthLog({
      email,
      event: 'sign_in_failure',
      method: 'google',
      request,
    })

    const search = new URLSearchParams({ error })
    if (redirectTo) search.set('redirectTo', redirectTo)

    return redirect(`/administration/sign-in?${search}`, {
      headers: { 'Set-Cookie': destroyCookie },
    })
  }

  const result = await verifyGoogleCallback({
    codeVerifier,
    storedNonce,
    storedState,
    url: new URL(request.url),
  })

  if (result.status === 'failed') throw failTo(result.error, result.email)

  const { email, subject } = result

  try {
    // Already linked → sign in that user.
    const connection = await prisma.connection.findUnique({
      select: { userId: true },
      where: {
        providerName_providerId: {
          providerId: subject,
          providerName: GOOGLE_PROVIDER_NAME,
        },
      },
    })

    if (connection !== null) {
      return await signInUser(
        request,
        connection.userId,
        'google',
        redirectTo,
        new Headers({ 'Set-Cookie': destroyCookie }),
      )
    }

    // First OAuth sign-in for an existing account → auto-link via verified email.
    const user = await findExistingUserByEmail(email)

    if (user === null) {
      throw failTo('account', email)
    }

    await prisma.connection.create({
      data: {
        providerId: subject,
        providerName: GOOGLE_PROVIDER_NAME,
        userId: user.id,
      },
    })

    return await signInUser(
      request,
      user.id,
      'google',
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
