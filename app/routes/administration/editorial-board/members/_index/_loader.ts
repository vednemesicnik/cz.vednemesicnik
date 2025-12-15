import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_member"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check create permission
  const { hasPermission: canCreate } = context.can({
    entity: "editorial_board_member",
    action: "create",
    targetAuthorId: context.authorId,
  })

  const editorialBoardMembers = await prisma.editorialBoardMember.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      fullName: true,
      state: true,
      author: {
        select: {
          id: true,
        },
      },
      positions: {
        select: {
          id: true,
          key: true,
        },
      },
    },
  })

  const membersWithPermissions = editorialBoardMembers.map((member) => {
    const { hasPermission: canView } = context.can({
      entity: "editorial_board_member",
      action: "view",
      state: member.state,
      targetAuthorId: member.author.id,
    })

    const { hasPermission: canEdit } = context.can({
      entity: "editorial_board_member",
      action: "update",
      state: member.state,
      targetAuthorId: member.author.id,
    })

    const { hasPermission: canDelete } = context.can({
      entity: "editorial_board_member",
      action: "delete",
      state: member.state,
      targetAuthorId: member.author.id,
    })

    return {
      id: member.id,
      fullName: member.fullName,
      state: member.state,
      positions: member.positions.map((position) => position.key).join(", "),
      canView,
      canEdit,
      canDelete,
    }
  })

  return {
    members: membersWithPermissions,
    canCreate,
  }
}
