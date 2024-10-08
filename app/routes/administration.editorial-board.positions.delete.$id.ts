// noinspection JSUnusedGlobalSymbols

import { type ActionFunctionArgs, redirect } from "@remix-run/node"
import { type ParamParseKey } from "@remix-run/router"

import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/editorial-board/positions/delete/:id">,
  string
>

export const loader = async () => {
  return redirect("/")
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { id } = params as RouteParams

  const formData = await request.formData()

  await validateCSRF(formData, request.headers)

  await prisma.$transaction(async (prisma) => {
    // Delete the position and get its order
    const { order: deletedPositionOrder } =
      await prisma.editorialBoardPosition.delete({
        where: { id },
      })

    // Get the positions with order greater than the deleted position's order
    const positionsToUpdate = await prisma.editorialBoardPosition.findMany({
      where: {
        order: {
          gt: deletedPositionOrder,
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    for (const position of positionsToUpdate) {
      await prisma.editorialBoardPosition.update({
        where: { id: position.id },
        data: {
          order: position.order - 1,
        },
      })
    }
  })

  return redirect("/administration/editorial-board/positions")
}
