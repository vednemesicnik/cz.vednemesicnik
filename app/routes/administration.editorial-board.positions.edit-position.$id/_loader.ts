import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/positions/edit-position/:id">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const { id } = params as RouteParams

  const editorialBoardPositionsCountPromise =
    prisma.editorialBoardPosition.count()

  const editorialBoardPositionPromise =
    prisma.editorialBoardPosition.findUniqueOrThrow({
      where: { id },
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

  return json({ editorialBoardPositionsCount, editorialBoardPosition, authors })
}
