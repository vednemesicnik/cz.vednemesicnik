import { href, redirect } from 'react-router'

import { GOOGLE_PROVIDER_NAME } from '~/config/connection-config'
import { requireSession } from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { prisma } from '~/utils/db.server'
import { markSessionAuthenticated } from '~/utils/identity-check/mark-session-authenticated.server'
import { verifyGoogleCallback } from '~/utils/oauth/verify-google-callback.server'
import { safeRedirect } from '~/utils/safe-redirect'

type IdentityCheckFailure = 'google-account' | 'google-failed'

/**
 * Finishes the identity check through Google (design 29d). Only the Google
 * account already linked to the signed-in user passes; it marks the current
 * session as freshly authenticated, links nothing and creates no session.
 *
 * @param args.request - The callback request.
 * @param args.oauth - The material kept in the vdm_oauth cookie.
 * @param args.destroyCookie - The Set-Cookie header that clears vdm_oauth.
 * @returns Never: a redirect to `redirectTo` (Nastavení with the dialog to
 *   reopen), with `identityCheck` naming the failure when it failed.
 */
export const verifyIdentityWithGoogle = async ({
  request,
  oauth,
  destroyCookie,
}: {
  request: Request
  oauth: {
    storedState: string | undefined
    storedNonce: string | undefined
    codeVerifier: string | undefined
    redirectTo: string | undefined
  }
  destroyCookie: string
}): Promise<never> => {
  const { sessionId, userId } = await requireSession(request)

  const returnTo = new URL(
    safeRedirect(oauth.redirectTo, href('/administration/settings')),
    'http://localhost',
  )
  const headers = { 'Set-Cookie': destroyCookie }

  const fail = (failure: IdentityCheckFailure) => {
    recordAuthLog({
      event: 'identity_check_failure',
      method: 'google',
      request,
      userId,
    })
    returnTo.searchParams.set('identityCheck', failure)

    return redirect(returnTo.pathname + returnTo.search, { headers })
  }

  const result = await verifyGoogleCallback({
    codeVerifier: oauth.codeVerifier,
    storedNonce: oauth.storedNonce,
    storedState: oauth.storedState,
    url: new URL(request.url),
  })

  // A Google account outside the domain is another account too (29d).
  if (result.status === 'failed') {
    throw fail(result.error === 'domain' ? 'google-account' : 'google-failed')
  }

  const connection = await prisma.connection.findUnique({
    select: { userId: true },
    where: {
      providerName_providerId: {
        providerId: result.subject,
        providerName: GOOGLE_PROVIDER_NAME,
      },
    },
  })

  if (connection?.userId !== userId) {
    throw fail('google-account')
  }

  await markSessionAuthenticated(sessionId)
  recordAuthLog({
    event: 'identity_check_success',
    method: 'google',
    request,
    userId,
  })

  throw redirect(returnTo.pathname + returnTo.search, { headers })
}
