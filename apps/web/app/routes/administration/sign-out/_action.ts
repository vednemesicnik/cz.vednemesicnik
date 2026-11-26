import { type ActionFunctionArgs, href, redirect } from 'react-router'

import {
  deleteSessionAuthCookieSession,
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { prisma } from '~/utils/db.server'
import { clearReaderViewCookie } from '~/utils/reader-view/clear-reader-view-cookie.server'
import { withRedirectTo } from '~/utils/with-redirect-to'

import { deleteSession } from './utils/delete-session.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
  const formData = await request.formData()
  const sessionId = getSessionAuthId(sessionAuthCookieSession)

  // Only record / delete for an actual session — a session-less POST is not a
  // real sign-out and must not create a noisy row or delete an undefined id.
  if (sessionId) {
    // Resolve the owner for the audit log before the session row is deleted.
    // Best-effort like the logging itself: a transient DB fault must not break
    // sign-out, so fall back to an unset userId instead of throwing.
    let userId: string | undefined
    try {
      const session = await prisma.session.findUnique({
        select: { userId: true },
        where: { id: sessionId },
      })
      userId = session?.userId
    } catch (error) {
      console.error('Failed to resolve session owner for sign-out event', error)
    }

    recordAuthLog({ event: 'sign_out', request, userId })

    deleteSession(sessionId)
  }

  // Sign-in, back to the page the sign-out came from. The page is sent by the
  // form, not read from Referer: a document opened at the sign-in link's
  // confirmation keeps its `no-referrer` policy for the whole session.
  const redirectTo = formData.get('redirectTo')

  // The reader view (10d) ends with the sign-in, so the next author in this
  // browser starts in the editorial preview.
  const headers = new Headers()
  headers.append(
    'Set-Cookie',
    await deleteSessionAuthCookieSession(sessionAuthCookieSession),
  )
  headers.append('Set-Cookie', await clearReaderViewCookie())

  return redirect(
    withRedirectTo(
      href('/administration/sign-in'),
      typeof redirectTo === 'string' ? redirectTo : '',
    ),
    { headers },
  )
}
