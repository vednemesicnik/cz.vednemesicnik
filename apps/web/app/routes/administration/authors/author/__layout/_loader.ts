import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { authorId } = params

  const author = await prisma.author.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: { id: authorId },
  })

  if (author === null) {
    throw data(null, { status: 404 })
  }

  return { author }
}
