import { renderToStaticMarkup } from 'react-dom/server'
import { redirect } from 'react-router'

import { isMinorOnDate } from '~/utils/membership-application/is-minor-on-date'
import { readMembershipApplicationCookie } from '~/utils/membership-application/read-membership-application-cookie.server'

import { getStepPath } from '../_step'
import type { Route } from './+types/route'
import { DeclarationSheet } from './components/declaration-sheet'

/**
 * The sheet as its own document, for the frame on the signature step and for its
 * own tab. It is a resource route so `entry.server` sets none of its headers: the
 * site's `X-Frame-Options: DENY` would keep it out of the frame.
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const application = await readMembershipApplicationCookie(request)

  if (application?.state !== 'details') {
    throw redirect(getStepPath('details'))
  }

  const { details } = application
  const markup = renderToStaticMarkup(
    <DeclarationSheet
      details={details}
      isMinor={isMinorOnDate(details.dateOfBirth, new Date())}
    />,
  )

  return new Response(`<!doctype html>${markup}`, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline' https://rsms.me; font-src 'self' https://rsms.me; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
