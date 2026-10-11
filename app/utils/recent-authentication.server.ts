import { href, redirect } from 'react-router'

import { requireAuthentication, requireSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { isRecentAuthentication } from '~/utils/recent-authentication'

/**
 * Whether the session was signed in or passed an identity check recently. A
 * session deleted meanwhile (signed out in another tab) counts as not recent
 * rather than an error.
 *
 * @param sessionId - The session to check.
 * @returns `true` when the session exists and is recent.
 */
export const isSessionRecent = async (sessionId: string) => {
  const session = await prisma.session.findUnique({
    select: { authenticatedAt: true },
    where: { id: sessionId },
  })

  return session !== null && isRecentAuthentication(session.authenticatedAt)
}

/**
 * Guard for form actions that change sign-in methods. Settings checks recency
 * before it opens such a dialog, so a stale session only gets here when a
 * dialog stayed open past the window; it goes back to Nastavení, where the
 * next attempt opens the identity check.
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
    throw redirect(href('/administration/settings'))
  }

  return authentication
}

/**
 * Check for fetch endpoints (passkey registration) that change sign-in
 * methods. A fetcher cannot follow a redirect to the identity check, so the
 * caller answers a stale session with a status the page can show.
 *
 * @param request - The incoming request.
 * @returns `true` when the request's session was authenticated recently.
 */
export const isRequestRecentlyAuthenticated = async (request: Request) => {
  const { sessionId } = await requireSession(request)

  return isSessionRecent(sessionId)
}
