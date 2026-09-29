import { href, redirect } from 'react-router'

import { requireAuthentication, requireSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { isRecentAuthentication } from '~/utils/recent-authentication'

/**
 * Whether the session was signed in recently. A session deleted meanwhile
 * (signed out in another tab) counts as not recent rather than an error.
 *
 * @param sessionId - The session to check.
 * @returns `true` when the session exists and is recent.
 */
export const isSessionRecent = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    select: { createdAt: true },
    where: { id: sessionId },
  })

  return session !== null && isRecentAuthentication(session.createdAt)
}

/**
 * Guard for pages and form actions that change sign-in methods. A session
 * signed in too long ago is sent to the identity check, which returns it to
 * `url` after a fresh sign-in.
 *
 * @param args - The request and React Router's normalized `url`.
 * @returns The session, like `requireAuthentication`.
 */
export const requireRecentAuthentication = async ({
  request,
  url,
}: {
  request: Request
  url: URL
}) => {
  const authentication = await requireAuthentication({ request, url })

  if (!(await isSessionRecent(authentication.sessionId))) {
    const search = new URLSearchParams({
      redirectTo: url.pathname + url.search,
    })

    throw redirect(
      `${href('/administration/settings/profile/verify-identity')}?${search}`,
    )
  }

  return authentication
}

/**
 * Check for fetch endpoints (passkey registration) that change sign-in
 * methods. A fetcher cannot follow a redirect to the identity check, so the
 * caller answers a stale session with a status the page can show.
 *
 * @param request - The incoming request.
 * @returns `true` when the request's session was signed in recently.
 */
export const isRequestRecentlyAuthenticated = async (request: Request) => {
  const { sessionId } = await requireSession(request)

  return isSessionRecent(sessionId)
}
