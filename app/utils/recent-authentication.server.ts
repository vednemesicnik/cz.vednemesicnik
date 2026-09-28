import { href, redirect } from 'react-router'

import { requireAuthentication, requireSession } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { isRecentAuthentication } from '~/utils/recent-authentication'

const isSessionRecent = async (sessionId: string) => {
  const session = await prisma.session.findUniqueOrThrow({
    select: { createdAt: true },
    where: { id: sessionId },
  })

  return isRecentAuthentication(session.createdAt)
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
 * Guard for fetch endpoints (passkey registration) that change sign-in
 * methods: a session signed in too long ago gets a 403 instead of a redirect.
 *
 * @param request - The incoming request.
 * @returns The session, like `requireSession`.
 */
export const assertRecentAuthentication = async (request: Request) => {
  const authentication = await requireSession(request)

  if (!(await isSessionRecent(authentication.sessionId))) {
    throw new Response('Pro tuto změnu se znovu přihlaste.', { status: 403 })
  }

  return authentication
}
