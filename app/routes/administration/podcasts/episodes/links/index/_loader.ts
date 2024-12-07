import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  await requireAuthentication(request)

  const { podcastId, episodeId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      title: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return { episode, podcast }
}
