import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const episode = await prisma.podcastEpisode.findUnique({
    select: {
      id: true,
      title: true,
    },
    where: { id: episodeId },
  })

  if (episode === null) {
    throw data(null, { status: 404 })
  }

  return { episode }
}
