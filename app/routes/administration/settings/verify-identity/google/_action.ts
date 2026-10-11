import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { CodeChallengeMethod } from 'google-auth-library'
import { data, href, redirect } from 'react-router'

import { GOOGLE_PROVIDER_NAME } from '~/config/connection-config'
import { requireActionSession } from '~/utils/auth.server'
import { requireCSRF } from '~/utils/csrf.server'
import { prisma } from '~/utils/db.server'
import {
  createGoogleOAuthClient,
  createOAuthRequestParams,
  GOOGLE_OAUTH_SCOPES,
  setOAuthCookieSession,
} from '~/utils/oauth.server'
import { rateLimitContext } from '~/utils/rate-limit.server'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

// Starts the identity check through Google (design 29d). Submitted by a
// fetcher: a refusal comes back as data for the dialog's error line, success
// leaves the page for Google, and the callback returns to `redirectTo`.
export const action = async ({ request, context }: Route.ActionArgs) => {
  const { userId } = await requireActionSession(request)

  const formData = await request.formData()
  await requireCSRF(formData, request)

  const limited = context.get(rateLimitContext)
  if (limited) {
    return data(
      { retryAfter: limited.retryAfter, status: 'rate-limited' as const },
      { status: 429 },
    )
  }

  // The dialog offers Google only to a linked account (design 29d).
  const connection = await prisma.connection.findFirst({
    select: { id: true },
    where: { providerName: GOOGLE_PROVIDER_NAME, userId },
  })

  if (connection === null) {
    return data({ status: 'failed' as const }, { status: 400 })
  }

  // Nastavení with the dialog to reopen; the callback re-validates it.
  const redirectTo = safeRedirect(
    formData.get('redirectTo'),
    href('/administration/settings'),
  )

  const { state, nonce, codeVerifier, codeChallenge } =
    createOAuthRequestParams()

  let authUrl: string
  let cookie: string
  try {
    const client = createGoogleOAuthClient()

    authUrl = client.generateAuthUrl({
      access_type: 'online',
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      hd: ALLOWED_EMAIL_DOMAIN,
      nonce,
      prompt: 'select_account',
      scope: GOOGLE_OAUTH_SCOPES,
      state,
    })

    cookie = await setOAuthCookieSession(request, {
      codeVerifier,
      nonce,
      purpose: 'verify-identity',
      redirectTo,
      state,
    })
  } catch {
    // Misconfigured/missing Google env must not 500: the dialog says Google
    // failed and the other paths still work.
    console.error('[google-oauth] failed to start the identity check')
    return data({ status: 'failed' as const }, { status: 500 })
  }

  throw redirect(authUrl, { headers: { 'Set-Cookie': cookie } })
}
