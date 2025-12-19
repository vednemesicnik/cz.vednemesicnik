import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast"],
    actions: ["view", "create", "update", "delete"],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    entity: "podcast",
    action: "view",
    state: "draft",
  })
  const publishedPerms = context.can({
    entity: "podcast",
    action: "view",
    state: "published",
  })
  const archivedPerms = context.can({
    entity: "podcast",
    action: "view",
    state: "archived",
  })

  const rawPodcasts = await prisma.podcast.findMany({
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
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      state: true,
      authorId: true,
    },
  })

  // Compute permissions for each podcast
  const podcasts = rawPodcasts.map((podcast) => {
    return {
      ...podcast,
      canView: context.can({
        entity: "podcast",
        action: "view",
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
      canEdit: context.can({
        entity: "podcast",
        action: "update",
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
      canDelete: context.can({
        entity: "podcast",
        action: "delete",
        state: podcast.state,
        targetAuthorId: podcast.authorId,
      }).hasPermission,
    }
  })

  return {
    podcasts,
    canCreate: context.can({
      entity: "podcast",
      action: "create",
      state: "draft",
      targetAuthorId: context.authorId,
    }).hasPermission,
  }
}
