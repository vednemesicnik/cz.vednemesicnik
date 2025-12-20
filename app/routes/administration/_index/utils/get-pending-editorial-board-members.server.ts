import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingEditorialBoardMembersOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingEditorialBoardMembers(
  options: GetPendingEditorialBoardMembersOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.EditorialBoardMemberWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.editorialBoardMember.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        fullName: true,
        id: true,
      },
      take: 5,
      where,
    }),
    prisma.editorialBoardMember.count({ where }),
  ])

  return { count, items }
}
