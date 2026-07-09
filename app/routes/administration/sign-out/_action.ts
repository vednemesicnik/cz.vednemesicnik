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

  // Resolve the owner for the audit log before the session row is deleted.
  const session = sessionId
    ? await prisma.session.findUnique({
        select: { userId: true },
        where: { id: sessionId },
      })
    : null

  recordAuthEvent({ event: 'sign_out', request, userId: session?.userId })

  deleteSession(sessionId)

  return redirectBack(request, {
    headers: {
      'Set-Cookie': await deleteSessionAuthCookieSession(
        sessionAuthCookieSession,
      ),
    },
  })
}
