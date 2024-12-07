import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeSlug } = params

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { slug: episodeSlug },
    select: { title: true },
  })

  return { podcastEpisode }
}
