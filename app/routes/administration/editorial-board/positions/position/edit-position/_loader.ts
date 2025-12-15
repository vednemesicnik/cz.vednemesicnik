import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { positionId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_position"],
    actions: ["update"],
  })

  const editorialBoardPosition =
    await prisma.editorialBoardPosition.findUniqueOrThrow({
      where: { id: positionId },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
        state: true,
        authorId: true,
        author: {
          select: {
            id: true,
          },
        },
      },
    })

  // Check if author can update this position
  checkAuthorPermission(context, {
    entity: "editorial_board_position",
    action: "update",
    state: editorialBoardPosition.state,
    targetAuthorId: editorialBoardPosition.author.id,
  })

  const [editorialBoardPositionsCount, authors] = await Promise.all([
    prisma.editorialBoardPosition.count(),
    getAuthorsByPermission(
      context,
      "editorial_board_position",
      "update",
      editorialBoardPosition.state
    ),
  ])

  return { editorialBoardPositionsCount, editorialBoardPosition, authors }
}
