import { data } from 'react-router'
import { getGrantBySlug } from '~/data/grants'
import type { Route } from './+types/route'

export const loader = ({ params }: Route.LoaderArgs) => {
  const { grantSlug } = params
  const grant = getGrantBySlug(grantSlug)

  if (!grant) {
    throw data(null, { status: 404 })
  }

  return { grant }
}
