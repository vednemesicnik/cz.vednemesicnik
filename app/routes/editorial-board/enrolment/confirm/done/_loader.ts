import { href, redirect } from 'react-router'

import { hasEnrolmentConfirmedCookie } from '~/utils/editorial-board-enrolment/has-enrolment-confirmed-cookie.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  if (!(await hasEnrolmentConfirmedCookie(request))) {
    throw redirect(href('/editorial-board/enrolment'))
  }

  return null
}
