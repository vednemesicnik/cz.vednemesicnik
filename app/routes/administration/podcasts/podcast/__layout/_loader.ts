import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const podcast = await prisma.podcast.findUnique({
    select: {
      id: true,
      title: true,
    },
    where: { id: podcastId },
  })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  return { podcast }
}
