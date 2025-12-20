import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { linkId } = params

  const link = await prisma.podcastEpisodeLink.findUniqueOrThrow({
    select: {
      id: true,
      label: true,
    },
    where: { id: linkId },
  })

  return { link }
}
