import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: {
      id: true,
      title: true,
    },
    where: { id: podcastId },
  })

  return { podcast }
}
