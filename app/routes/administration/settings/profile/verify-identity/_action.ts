import { href, redirect } from 'react-router'

import {
  deleteSessionAuthCookieSession,
  getSessionAuthCookieSession,
  requireSession,
} from '~/utils/auth.server'
import { recordAuthLog } from '~/utils/auth-log.server'
import { requireCSRF } from '~/utils/csrf.server'
import { safeRedirect } from '~/utils/safe-redirect'

import { deleteSession } from '../../../sign-out/utils/delete-session.server'
import type { Route } from './+types/route'

// Ends the current session and sends the user to sign-in, which returns them to
// `redirectTo` with a fresh session that may change sign-in methods.
export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  await requireCSRF(formData, request)

  const { sessionId, userId } = await requireSession(request)

  const redirectTo = safeRedirect(
    formData.get('redirectTo'),
    '/administration/settings/profile',
  )

  recordAuthLog({ event: 'sign_out', request, userId })
  deleteSession(sessionId)

  const cookieSession = await getSessionAuthCookieSession(request)
  const search = new URLSearchParams({ redirectTo })

  return redirect(`${href('/administration/sign-in')}?${search}`, {
    headers: {
      'Set-Cookie': await deleteSessionAuthCookieSession(cookieSession),
    },
  })
}
