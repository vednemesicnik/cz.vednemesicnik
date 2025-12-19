import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingEditorialBoardMembersOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingEditorialBoardMembers(
  options: GetPendingEditorialBoardMembersOptions
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.EditorialBoardMemberWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.editorialBoardMember.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.editorialBoardMember.count({ where }),
  ])

  return { items, count }
}
