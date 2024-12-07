import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  await requireAuthentication(request)

  const { memberId } = params

  const editorialBoardMemberPromise =
    prisma.editorialBoardMember.findUniqueOrThrow({
      where: { id: memberId },
      select: {
        id: true,
        fullName: true,
        positions: {
          select: {
            id: true,
          },
        },
        authorId: true,
      },
    })

  const editorialBoardMemberPositionsPromise =
    prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [editorialBoardMember, editorialBoardMemberPositions, authors] =
    await Promise.all([
      editorialBoardMemberPromise,
      editorialBoardMemberPositionsPromise,
      authorsPromise,
    ])

  return { editorialBoardMember, editorialBoardMemberPositions, authors }
}
