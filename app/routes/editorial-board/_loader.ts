import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

const DEFAULT_MAX_AGE = 60 * 30 // 30 minutes in seconds

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

  return json(
    { editorialBoardMemberPositions },
    { headers: { "Cache-Control": `public, max-age=${DEFAULT_MAX_AGE}` } }
  )
}
