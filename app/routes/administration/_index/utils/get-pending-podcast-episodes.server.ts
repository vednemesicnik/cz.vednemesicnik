import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingPodcastEpisodesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingPodcastEpisodes(
  options: GetPendingPodcastEpisodesOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.PodcastEpisodeWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.podcastEpisode.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        id: true,
        podcast: { select: { id: true, title: true } },
        title: true,
      },
      take: 5,
      where,
    }),
    prisma.podcastEpisode.count({ where }),
  ])

  return { count, items }
}
