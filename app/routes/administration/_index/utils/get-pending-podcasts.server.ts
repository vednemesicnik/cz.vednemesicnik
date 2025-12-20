import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingPodcastsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingPodcasts(options: GetPendingPodcastsOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.PodcastWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.podcast.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        id: true,
        title: true,
      },
      take: 5,
      where,
    }),
    prisma.podcast.count({ where }),
  ])

  return { count, items }
}
