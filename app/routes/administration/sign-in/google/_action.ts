import { ALLOWED_EMAIL_DOMAIN } from '@constants/auth'
import { CodeChallengeMethod } from 'google-auth-library'
import { redirect } from 'react-router'

import { requireUnauthenticated } from '~/utils/auth.server'
import { checkHoneypot } from '~/utils/honeypot.server'
import {
  createGoogleOAuthClient,
  createOAuthRequestParams,
  GOOGLE_OAUTH_SCOPES,
  setOAuthCookieSession,
} from '~/utils/oauth.server'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

export const action = async ({ request }: Route.ActionArgs) => {
  // Enforce the auth boundary in the handler: a direct POST must not let an
  // already-signed-in admin restart the flow and swap sessions.
  await requireUnauthenticated(request)

  const formData = await request.formData()

  checkHoneypot(formData)

  // Sanitize now so only a same-origin target is ever carried across the
  // round-trip; signInUser re-validates it in the callback as defense in depth.
  const redirectTo = safeRedirect(formData.get('redirectTo'))

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
      // hd optimizes the account picker; the real domain enforcement is the
      // id_token `hd` claim check in the callback (this param is client-visible).
      hd: ALLOWED_EMAIL_DOMAIN,
      nonce,
      prompt: 'select_account',
      scope: GOOGLE_OAUTH_SCOPES,
      state,
    })

    cookie = await setOAuthCookieSession(request, {
      codeVerifier,
      nonce,
      redirectTo,
      state,
    })
  } catch {
    // Misconfigured/missing Google env must not 500 a user-triggered POST —
    // bounce back to the chooser (keeping redirectTo) so the other sign-in
    // methods still work. 303 → the client follows up with a GET.
    console.error('[google-oauth] failed to start the OAuth flow')
    const search = new URLSearchParams({ error: 'oauth', redirectTo })
    throw redirect(`/administration/sign-in?${search}`, { status: 303 })
  }

  // 303 See Other: this is a POST, so force the client to GET the authorize URL.
  throw redirect(authUrl, { headers: { 'Set-Cookie': cookie }, status: 303 })
}
