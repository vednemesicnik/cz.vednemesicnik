import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const editoiralBoardMembers = await prisma.editorialBoardMember.findMany({
    select: {
      id: true,
      fullName: true,
      positions: {
        select: {
          id: true,
          key: true,
        },
      },
    },
  })

  return json({ editoiralBoardMembers })
}
