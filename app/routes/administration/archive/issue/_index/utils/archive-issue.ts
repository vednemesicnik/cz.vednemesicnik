import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const archiveIssue = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "issue",
    action: "archive",
    target: options.target,
    execute: () =>
      prisma.issue.update({
        where: { id: options.id },
        data: { state: "archived" },
      }),
  })
