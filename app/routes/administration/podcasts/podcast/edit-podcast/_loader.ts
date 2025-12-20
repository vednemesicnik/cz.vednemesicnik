import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { requireAuthorPermission } from "~/utils/permissions/author/guards/require-author-permission.server"
import { getAuthorsByPermission } from "~/utils/permissions/author/queries/get-authors-by-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast"],
    actions: ["update"],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: params.podcastId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      state: true,
      authorId: true,
      author: {
        select: {
          id: true,
        },
      },
      cover: {
        select: {
          id: true,
        },
      },
    },
  })

  requireAuthorPermission(context, {
    entity: "podcast",
    action: "update",
    state: podcast.state,
    targetAuthorId: podcast.authorId,
    redirectTo: href("/administration/podcasts/:podcastId", {
      podcastId: podcast.id,
    }),
  })

  const authors = await getAuthorsByPermission(
    context,
    "podcast",
    "update",
    podcast.state
  )

  return {
    podcast,
    authors,
  }
}
