import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { memberId } = params

  const member = await prisma.editorialBoardMember.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      fullName: true,
    },
  })

  return { member }
}