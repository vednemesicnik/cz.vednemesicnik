import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const archiveMember = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "editorial_board_member",
    action: "archive",
    target: options.target,
    execute: () =>
      prisma.editorialBoardMember.update({
        where: { id: options.id },
        data: { state: "archived" },
      }),
  })