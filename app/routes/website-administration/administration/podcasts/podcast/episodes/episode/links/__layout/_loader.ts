import type { Route } from "~/routes/website-administration/administration/podcasts/podcast/episodes/episode/links/_index/+types/route"
import { prisma } from "~/utils/db.server"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const podcastEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { title: true },
  })

  return { podcastEpisode }
}
