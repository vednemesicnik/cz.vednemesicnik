import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingArticleTagsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticleTags(
  options: GetPendingArticleTagsOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleTagWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.articleTag.findMany({
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
    prisma.articleTag.count({ where }),
  ])

  return { count, items }
}
