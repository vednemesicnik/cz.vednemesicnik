import { href, redirect } from 'react-router'

import { readActivityAnsweredCookie } from '~/utils/editorial-board-activity/read-activity-answered-cookie.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const action = await readActivityAnsweredCookie(request)

  if (action === null) {
    throw redirect(href('/editorial-board'))
  }

  return { action }
}
