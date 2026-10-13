import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

type GetPendingArticleCategoriesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticleCategories(
  options: GetPendingArticleCategoriesOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  // Waiting = submitted and not yet approved by an approver (design 07a, 07d);
  // approved content waits for its order, not for work, and leaves the queue.
  const where: Prisma.ArticleCategoryWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    reviews: {
      none: { reviewer: { role: { level: { lte: APPROVER_ROLE_LEVEL } } } },
    },
    state: 'draft',
    submittedAt: { not: null },
  }

  const [items, count] = await Promise.all([
    prisma.articleCategory.findMany({
      // Front of the queue first: a resubmitted item goes to the back.
      orderBy: { submittedAt: 'asc' },
      select: {
        author: { select: { name: true } },
        id: true,
        name: true,
        submittedAt: true,
      },
      take: 5,
      where,
    }),
    prisma.articleCategory.count({ where }),
  ])

  return { count, items }
}
