import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode_link"],
    actions: ["create"],
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
    },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [podcast, episode, authors] = await Promise.all([
    podcastPromise,
    episodePromise,
    authorsPromise,
  ])

  // Check if user can create draft links
  checkAuthorPermission(context, {
    entity: "podcast_episode_link",
    action: "create",
    state: "draft",
    targetAuthorId: context.authorId,
  })

  return {
    podcast,
    episode,
    authors,
    selfAuthorId: context.authorId,
  }
}
