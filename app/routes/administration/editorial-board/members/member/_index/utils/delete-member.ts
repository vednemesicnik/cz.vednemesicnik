import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const deleteMember = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "editorial_board_member",
    action: "delete",
    target: options.target,
    execute: () =>
      prisma.editorialBoardMember.delete({ where: { id: options.id } }),
  })