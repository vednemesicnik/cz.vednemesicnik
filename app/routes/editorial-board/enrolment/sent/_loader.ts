import { href, redirect } from 'react-router'

import { readEnrolmentSentCookie } from '~/utils/editorial-board-enrolment/read-enrolment-sent-cookie.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const email = await readEnrolmentSentCookie(request)

  if (email === null) throw redirect(href('/editorial-board/enrolment'))

  return { email }
}
