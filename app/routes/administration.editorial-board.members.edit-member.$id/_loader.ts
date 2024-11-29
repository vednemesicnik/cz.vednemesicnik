import { type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/members/edit-member/:id">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const { id } = params as RouteParams

  const editorialBoardMemberPromise =
    prisma.editorialBoardMember.findUniqueOrThrow({
      where: { id },
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
