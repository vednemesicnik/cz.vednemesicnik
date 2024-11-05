import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const editorialBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  return json({ editorialBoardMemberPositions })
}
