import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode_link"],
    actions: ["view", "create", "update", "delete"],
  })

  const { podcastId, episodeId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      title: true,
      state: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
          state: true,
          authorId: true,
        },
      },
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  // Compute permissions for each link
  const links = episode.links.map((link) => {
    return {
      ...link,
      canView: context.can({
        entity: "podcast_episode_link",
        action: "view",
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
      canEdit: context.can({
        entity: "podcast_episode_link",
        action: "update",
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
      canDelete: context.can({
        entity: "podcast_episode_link",
        action: "delete",
        state: link.state,
        targetAuthorId: link.authorId,
      }).hasPermission,
    }
  })

  return {
    episode: {
      ...episode,
      links,
    },
    podcast,
    canCreate: context.can({
      entity: "podcast_episode_link",
      action: "create",
      state: "draft",
      targetAuthorId: context.authorId,
    }).hasPermission,
  }
}
