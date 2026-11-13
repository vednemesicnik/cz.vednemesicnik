import { readDonationRequestCookie } from '~/utils/donation-request/read-donation-request-cookie.server'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

export async function loader({ request, url }: Route.LoaderArgs) {
  const saved = await readDonationRequestCookie(request)
  const honeypotInputProps = getHoneypotInputProps()
  const requestableYears = [1, 2, 3].map((offset) =>
    String(new Date().getFullYear() - offset),
  )

  return {
    // Back from the code to correct the details: the form is filled again.
    details: saved?.state === 'details' ? saved.details : null,
    honeypotInputProps,
    // The verify step found no saved request: the week ran out, or cookies are off.
    isExpired: url.searchParams.get('reason') === 'expired',
    requestableYears,
  }
}
