import { prisma } from "~/utils/db.server"

import type { Route } from "../index/+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastSlug } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { slug: podcastSlug },
    select: { title: true },
  })

  return { podcast }
}
