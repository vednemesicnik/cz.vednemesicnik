import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId">,
  string
>
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { podcastId, episodeId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      title: true,
      links: {
        select: {
          id: true,
          label: true,
          url: true,
        },
      },
    },
  })

  const [podcast, episode] = await Promise.all([podcastPromise, episodePromise])

  return json({ episode, podcast })
}
