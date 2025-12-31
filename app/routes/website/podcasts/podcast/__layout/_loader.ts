import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastSlug } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    select: { title: true },
    where: { slug: podcastSlug },
  })

  return { podcast }
}
