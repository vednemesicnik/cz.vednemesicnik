import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { userId } = params

  const user = await prisma.user.findUniqueOrThrow({
    select: {
      id: true,
      name: true,
    },
    where: { id: userId },
  })

  return { user }
}
