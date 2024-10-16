import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/edit-link/:linkId">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const { podcastId, episodeId, linkId } = params as RouteParams

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { id: true },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: { id: true },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: {
      id: true,
      label: true,
      url: true,
    },
  })

  const [podcast, episode, link] = await Promise.all([
    podcastPromise,
    episodePromise,
    linkPromise,
  ])

  return json({ podcast, episode, link })
}
