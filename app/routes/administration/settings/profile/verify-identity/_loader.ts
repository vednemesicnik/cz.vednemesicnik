import { redirect } from 'react-router'

import { requireAuthentication } from '~/utils/auth.server'
import { isSessionRecent } from '~/utils/recent-authentication.server'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication({ request, url })

  const redirectTo = safeRedirect(
    url.searchParams.get('redirectTo'),
    '/administration/settings/profile',
  )

  // Freshly signed in (typically on the way back from sign-in): continue.
  if (await isSessionRecent(sessionId)) {
    throw redirect(redirectTo)
  }

  return { redirectTo }
}
