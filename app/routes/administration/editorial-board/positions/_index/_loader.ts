import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_position"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check create permission
  const { hasPermission: canCreate } = context.can({
    entity: "editorial_board_position",
    action: "create",
    targetAuthorId: context.authorId,
  })

  const editorialBoardPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
        state: true,
        author: {
          select: {
            id: true,
          },
        },
      },
    })

  const positionsWithPermissions = editorialBoardPositions.map((position) => {
    const { hasPermission: canView } = context.can({
      entity: "editorial_board_position",
      action: "view",
      state: position.state,
      targetAuthorId: position.author.id,
    })

    const { hasPermission: canEdit } = context.can({
      entity: "editorial_board_position",
      action: "update",
      state: position.state,
      targetAuthorId: position.author.id,
    })

    const { hasPermission: canDelete } = context.can({
      entity: "editorial_board_position",
      action: "delete",
      state: position.state,
      targetAuthorId: position.author.id,
    })

    return {
      id: position.id,
      key: position.key,
      pluralLabel: position.pluralLabel,
      order: position.order,
      state: position.state,
      canView,
      canEdit,
      canDelete,
    }
  })

  return {
    positions: positionsWithPermissions,
    canCreate,
  }
}
