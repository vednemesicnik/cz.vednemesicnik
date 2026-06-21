import { getDonationConfirmationYear } from '~/utils/get-donation-confirmation-year'
import type { Route } from './+types/route'

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get('id') ?? undefined
  return { requestId, year: getDonationConfirmationYear() }
}
