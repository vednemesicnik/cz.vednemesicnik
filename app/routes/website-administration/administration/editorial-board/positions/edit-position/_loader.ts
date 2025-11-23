import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  await requireAuthentication(request)

  const { positionId } = params

  const editorialBoardPositionsCountPromise =
    prisma.editorialBoardPosition.count()

  const editorialBoardPositionPromise =
    prisma.editorialBoardPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
        authorId: true,
      },
    })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [editorialBoardPositionsCount, editorialBoardPosition, authors] =
    await Promise.all([
      editorialBoardPositionsCountPromise,
      editorialBoardPositionPromise,
      authorsPromise,
    ])

  return { editorialBoardPositionsCount, editorialBoardPosition, authors }
}
