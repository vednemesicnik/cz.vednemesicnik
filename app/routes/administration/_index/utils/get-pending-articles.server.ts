import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

type GetPendingArticlesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticles(options: GetPendingArticlesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  // Waiting = submitted and not yet approved by an approver (design 07a, 07d);
  // approved articles wait for their order, not for work, and leave the queue.
  const where: Prisma.ArticleWhereInput = {
    authors:
      currentRoleLevel === 1
        ? { none: { id: currentAuthorId } }
        : {
            every: { role: { level: { gt: currentRoleLevel } } },
            none: { id: currentAuthorId },
          },
    reviews: {
      none: { reviewer: { role: { level: { lte: APPROVER_ROLE_LEVEL } } } },
    },
    state: 'draft',
    submittedAt: { not: null },
  }

  const [items, count] = await Promise.all([
    prisma.article.findMany({
      // Front of the queue first: a resubmitted article goes to the back.
      orderBy: { submittedAt: 'asc' },
      select: {
        authors: { select: { name: true } },
        id: true,
        submittedAt: true,
        title: true,
      },
      take: 5,
      where,
    }),
    prisma.article.count({ where }),
  ])

  return { count, items }
}
