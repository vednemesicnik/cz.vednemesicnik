import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const editorialBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        pluralLabel: true,
        members: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

  return { editorialBoardMemberPositions }
}
