import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { positionId } = params

  const position = await prisma.editorialBoardPosition.findUnique({
    where: { id: positionId },
    select: {
      id: true,
      pluralLabel: true,
    },
  })

  return { position }
}
