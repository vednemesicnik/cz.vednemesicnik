import type { ActionFunctionArgs } from 'react-router'

import {
  deleteSessionAuthCookieSession,
  getSessionAuthCookieSession,
  getSessionAuthId,
} from '~/utils/auth.server'
import { redirectBack } from '~/utils/redirect-back'

import { deleteSession } from './utils/delete-session.server'

export const action = async ({ request }: ActionFunctionArgs) => {
  const sessionAuthCookieSession = await getSessionAuthCookieSession(request)
  const sessionId = getSessionAuthId(sessionAuthCookieSession)

  deleteSession(sessionId)

  return redirectBack(request, {
    headers: {
      'Set-Cookie': await deleteSessionAuthCookieSession(
        sessionAuthCookieSession,
      ),
    },
  })
}
