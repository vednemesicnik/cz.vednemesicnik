import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { requireAuthorPermission } from "~/utils/permissions/author/guards/require-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId, episodeId } = params

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      number: true,
      title: true,
      slug: true,
      description: true,
      state: true,
      authorId: true,
    },
  })

  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode"],
    actions: ["update"],
  })

  requireAuthorPermission(context, {
    entity: "podcast_episode",
    action: "update",
    state: episode.state,
    targetAuthorId: episode.authorId,
    redirectTo: href(
      "/administration/podcasts/:podcastId/episodes/:episodeId",
      { podcastId, episodeId }
    ),
  })

  const authors = await getAuthorsByPermission(
    context,
    "podcast_episode",
    "update",
    episode.state
  )

  return {
    podcastId,
    episode,
    authors,
  }
}