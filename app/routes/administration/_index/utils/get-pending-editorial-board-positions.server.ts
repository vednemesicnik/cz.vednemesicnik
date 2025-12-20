import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingEditorialBoardPositionsOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingEditorialBoardPositions(
  options: GetPendingEditorialBoardPositionsOptions,
) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.EditorialBoardPositionWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.editorialBoardPosition.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        id: true,
        key: true,
      },
      take: 5,
      where,
    }),
    prisma.editorialBoardPosition.count({ where }),
  ])

  return { count, items }
}
