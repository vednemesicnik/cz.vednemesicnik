import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const deleteIssue = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "issue",
    action: "delete",
    target: options.target,
    execute: () => prisma.issue.delete({ where: { id: options.id } }),
  })
