import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingArticlesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticles(options: GetPendingArticlesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.article.findMany({
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
    prisma.article.count({ where }),
  ])

  return { items, count }
}
