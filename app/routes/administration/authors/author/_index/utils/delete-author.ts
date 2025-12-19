import { prisma } from "~/utils/db.server"
import { withUserPermission } from "~/utils/permissions/user/actions/with-user-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withUserPermission>[1]["target"]
}

export const deleteAuthor = (request: Request, options: Options) =>
  withUserPermission(request, {
    entity: "author",
    action: "delete",
    target: options.target,
    execute: async () => {
      await prisma.author.delete({ where: { id: options.id } })
    },
  })