import { readDonationRequestCookie } from '~/utils/donation-request/read-donation-request-cookie.server'
import { getHoneypotInputProps } from '~/utils/honeypot.server'

import type { Route } from './+types/route'

const REASONS = ['expired', 'rejected'] as const

const parseReason = (value: string | null) =>
  REASONS.find((reason) => reason === value) ?? null

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
    // Why the verify step sent the donor back (15l): no saved request (the week
    // ran out, or cookies are off), or the script refused the details.
    reason: parseReason(url.searchParams.get('reason')),
    requestableYears,
  }
}
