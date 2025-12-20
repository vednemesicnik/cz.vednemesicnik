import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingArticleCategoriesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticleCategories(
  options: GetPendingArticleCategoriesOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleCategoryWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.articleCategory.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        id: true,
        name: true,
      },
      take: 5,
      where,
    }),
    prisma.articleCategory.count({ where }),
  ])

  return { count, items }
}
