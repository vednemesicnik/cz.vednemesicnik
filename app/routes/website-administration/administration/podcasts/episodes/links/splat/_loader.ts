import { prisma } from "~/utils/db.server"

import type { Route } from "../index/+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { title: true },
  })

  return { podcastEpisode }
}
