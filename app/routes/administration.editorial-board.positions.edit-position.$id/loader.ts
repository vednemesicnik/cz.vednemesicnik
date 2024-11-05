import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/positions/edit-position/:id">,
  string
>
export const loader = async ({ params }: LoaderFunctionArgs) => {
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
      },
    })

  const [editorialBoardPositionsCount, editorialBoardPosition] =
    await Promise.all([
      editorialBoardPositionsCountPromise,
      editorialBoardPositionPromise,
    ])

  return json({ editorialBoardPositionsCount, editorialBoardPosition })
}
