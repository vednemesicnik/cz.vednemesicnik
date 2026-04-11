import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingArticlesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticles(options: GetPendingArticlesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleWhereInput = {
    authors:
      currentRoleLevel === 1
        ? { none: { id: currentAuthorId } }
        : {
            none: { id: currentAuthorId },
            every: { role: { level: { gt: currentRoleLevel } } },
          },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        authors: { select: { name: true } },
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
