import { getGrantBySlug } from '~/data/grants'
import type { Route } from './+types/route'

export const loader = ({ params }: Route.LoaderArgs) => {
  const { grantSlug } = params
  const grant = getGrantBySlug(grantSlug)

  if (!grant) {
    throw new Response('Projekt nenalezen', { status: 404 })
  }

  return { grant }
}
