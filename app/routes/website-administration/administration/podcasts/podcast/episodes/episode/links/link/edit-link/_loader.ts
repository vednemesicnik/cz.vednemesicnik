import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode_link"],
    actions: ["update"],
  })

  const { podcastId, episodeId, linkId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      state: true,
    },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: {
      id: true,
      label: true,
      url: true,
      authorId: true,
    },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [podcast, episode, link, authors] = await Promise.all([
    podcastPromise,
    episodePromise,
    linkPromise,
    authorsPromise,
  ])

  // Check if user can edit this link
  checkAuthorPermission(context, {
    entity: "podcast_episode_link",
    action: "update",
    state: episode.state,
    targetAuthorId: link.authorId,
  })

  return {
    podcast,
    episode,
    link,
    authors,
  }
}
