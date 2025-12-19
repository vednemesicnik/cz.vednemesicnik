import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingArticleCategoriesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingArticleCategories(
  options: GetPendingArticleCategoriesOptions
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.ArticleCategoryWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.articleCategory.findMany({
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
    prisma.articleCategory.count({ where }),
  ])

  return { items, count }
}