import type { Route } from './+types/route'

// TODO: fetch totalDonated from bank API
export const loader = async (_: Route.LoaderArgs) => {
  return { totalDonated: 0 }
}
