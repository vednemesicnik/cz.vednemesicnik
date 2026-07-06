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

  const client = createGoogleOAuthClient()

  const authUrl = client.generateAuthUrl({
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

  throw redirect(authUrl, {
    headers: {
      'Set-Cookie': await setOAuthCookieSession(request, {
        codeVerifier,
        nonce,
        redirectTo,
        state,
      }),
    },
  })
}
