import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/edit-episode/:episodeId">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const { podcastId, episodeId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
    },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      number: true,
      title: true,
      slug: true,
      description: true,
      published: true,
      publishedAt: true,
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return json({ podcast, episode })
}
