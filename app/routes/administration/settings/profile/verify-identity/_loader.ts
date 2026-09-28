import { redirect } from 'react-router'

import { requireAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import { isRecentAuthentication } from '~/utils/recent-authentication'
import { safeRedirect } from '~/utils/safe-redirect'

import type { Route } from './+types/route'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication({ request, url })

  const redirectTo = safeRedirect(
    url.searchParams.get('redirectTo'),
    '/administration/settings/profile',
  )

  const session = await prisma.session.findUniqueOrThrow({
    select: { createdAt: true },
    where: { id: sessionId },
  })

  // Freshly signed in (typically on the way back from sign-in): continue.
  if (isRecentAuthentication(session.createdAt)) {
    throw redirect(redirectTo)
  }

  return { redirectTo }
}
