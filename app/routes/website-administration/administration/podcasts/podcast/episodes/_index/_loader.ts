import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode"],
    actions: ["view", "create", "update", "delete"],
  })

  const { podcastId } = params

  // Check view permissions for each state
  const draftPerms = context.can({
    entity: "podcast_episode",
    action: "view",
    state: "draft",
  })
  const publishedPerms = context.can({
    entity: "podcast_episode",
    action: "view",
    state: "published",
  })
  const archivedPerms = context.can({
    entity: "podcast_episode",
    action: "view",
    state: "archived",
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      episodes: {
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
        select: {
          id: true,
          title: true,
          publishedAt: true,
          state: true,
          authorId: true,
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  })

  // Compute permissions for each episode
  const episodes = podcast.episodes.map((episode) => {
    return {
      ...episode,
      canView: context.can({
        entity: "podcast_episode",
        action: "view",
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
      canEdit: context.can({
        entity: "podcast_episode",
        action: "update",
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
      canDelete: context.can({
        entity: "podcast_episode",
        action: "delete",
        state: episode.state,
        targetAuthorId: episode.authorId,
      }).hasPermission,
    }
  })

  return {
    podcast: {
      ...podcast,
      episodes,
    },
    canCreate: context.can({
      entity: "podcast_episode",
      action: "create",
      state: "draft",
      targetAuthorId: context.authorId,
    }).hasPermission,
  }
}
