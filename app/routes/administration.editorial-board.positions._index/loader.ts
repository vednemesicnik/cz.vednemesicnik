import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const editoiralBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
      },
    })

  return json({ editoiralBoardMemberPositions })
}
