import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    entity: "issue",
    action: "view",
    state: "draft",
  })
  const publishedPerms = context.can({
    entity: "issue",
    action: "view",
    state: "published",
  })
  const archivedPerms = context.can({
    entity: "issue",
    action: "view",
    state: "archived",
  })

  const rawIssues = await prisma.issue.findMany({
    where: {
      OR: [
        {
          state: "draft",
          ...(draftPerms.hasOwn && !draftPerms.hasAny
            ? { authorId: context.authorId }
            : {}),
        },
        {
          state: "published",
          ...(publishedPerms.hasOwn && !publishedPerms.hasAny
            ? { authorId: context.authorId }
            : {}),
        },
        {
          state: "archived",
          ...(archivedPerms.hasOwn && !archivedPerms.hasAny
            ? { authorId: context.authorId }
            : {}),
        },
      ],
    },
    orderBy: {
      releasedAt: "desc",
    },
    select: {
      id: true,
      label: true,
      state: true,
      authorId: true,
    },
  })

  // Compute permissions for each issue
  const issues = rawIssues.map((issue) => {
    return {
      ...issue,
      canView: context.can({
        entity: "issue",
        action: "view",
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
      canEdit: context.can({
        entity: "issue",
        action: "update",
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
      canDelete: context.can({
        entity: "issue",
        action: "delete",
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
    }
  })

  return {
    issues,
    canCreate: context.can({
      entity: "issue",
      action: "create",
      state: "draft",
    }).hasPermission,
  }
}
