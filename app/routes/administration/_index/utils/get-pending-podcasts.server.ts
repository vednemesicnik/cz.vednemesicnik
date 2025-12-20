import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingPodcastsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingPodcasts(options: GetPendingPodcastsOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.PodcastWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.podcast.findMany({
      where,
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.podcast.count({ where }),
  ])

  return { items, count }
}
