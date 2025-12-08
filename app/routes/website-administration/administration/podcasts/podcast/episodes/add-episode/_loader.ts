import { prisma } from "~/utils/db.server"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"
import { checkAuthorPermission } from "~/utils/permissions/author/guards/check-author-permission.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode"],
    actions: ["create"],
  })

  checkAuthorPermission(context, {
    entity: "podcast_episode",
    action: "create",
    state: "draft",
    targetAuthorId: context.authorId,
  })

  const { podcastId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
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

  const [podcast, authors] = await Promise.all([podcastPromise, authorsPromise])

  return {
    podcast,
    authors,
    selfAuthorId: context.authorId,
  }
}
