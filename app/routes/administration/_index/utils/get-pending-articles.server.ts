import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingArticlesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticles(options: GetPendingArticlesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.article.findMany({
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
    prisma.article.count({ where }),
  ])

  return { count, items }
}
