import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingArticleTagsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticleTags(
  options: GetPendingArticleTagsOptions
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleTagWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.articleTag.findMany({
      where,
      select: {
        id: true,
        name: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.articleTag.count({ where }),
  ])

  return { items, count }
}
