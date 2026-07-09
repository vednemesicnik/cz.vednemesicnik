import type { ActionFunctionArgs } from 'react-router'
import {
  deleteSessionAuthCookieSession,
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'
import { recordAuthEvent } from '~/utils/auth-event.server'
import { prisma } from '~/utils/db.server'
import { redirectBack } from '~/utils/redirect-back'

import { deleteSession } from './utils/delete-session.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
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

    recordAuthEvent({ event: 'sign_out', request, userId })

    deleteSession(sessionId)
  }

  return redirectBack(request, {
    headers: {
      'Set-Cookie': await deleteSessionAuthCookieSession(
        sessionAuthCookieSession,
      ),
    },
  })
}
