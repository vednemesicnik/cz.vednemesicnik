import { redirect } from 'react-router'

import { readDonationRequestCookie } from '~/utils/donation-request/read-donation-request-cookie.server'

import { getStepPath } from '../_step'
import type { Route } from './+types/route'

// The request's code comes from the signed cookie the verify step wrote, never
// from the address: nobody can make the page show a code of their own.
export async function loader({ request }: Route.LoaderArgs) {
  const saved = await readDonationRequestCookie(request)

  if (saved?.state !== 'sent') throw redirect(getStepPath('details'))

  return {
    requestId: saved.requestId,
    // The code starts with the year the confirmation is for (2025-K7M2QX).
    year: saved.requestId.slice(0, 4),
  }
}
