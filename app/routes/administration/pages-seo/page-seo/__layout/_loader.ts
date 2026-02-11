import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { pageSEOId } = params

  const pageSEO = await prisma.pageSEO.findUnique({
    select: {
      id: true,
      title: true,
    },
    where: { id: pageSEOId },
  })

  return { pageSEO }
}
