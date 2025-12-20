import { prisma } from '~/utils/db.server'

export const loader = async () => {
  const editorialBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        members: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            fullName: true,
            id: true,
          },
        },
        pluralLabel: true,
      },
    })

  return { editorialBoardMemberPositions }
}
