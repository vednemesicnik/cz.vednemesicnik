import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { userId } = params

  const user = await prisma.user.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: { id: userId },
  })

  if (user === null) {
    throw data(null, { status: 404 })
  }

  return { user }
}
