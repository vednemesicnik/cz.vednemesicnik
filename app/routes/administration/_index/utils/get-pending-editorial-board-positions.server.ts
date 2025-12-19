import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingEditorialBoardPositionsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingEditorialBoardPositions(
  options: GetPendingEditorialBoardPositionsOptions
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.EditorialBoardPositionWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.editorialBoardPosition.findMany({
      where,
      select: {
        id: true,
        key: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.editorialBoardPosition.count({ where }),
  ])

  return { items, count }
}