import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      id: true,
      title: true,
    },
    where: { id: episodeId },
  })

  return { episode }
}
