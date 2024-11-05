import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  return json({ editorialBoardPositionsCount })
}
