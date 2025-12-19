import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingPodcastEpisodesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingPodcastEpisodes(
  options: GetPendingPodcastEpisodesOptions
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.PodcastEpisodeWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.podcastEpisode.findMany({
      where,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true } },
        podcast: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.podcastEpisode.count({ where }),
  ])

  return { items, count }
}
