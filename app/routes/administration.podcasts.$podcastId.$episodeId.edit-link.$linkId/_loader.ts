import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/edit-link/:linkId">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const { podcastId, episodeId, linkId } = params as RouteParams

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { user: { select: { authorId: true } } },
  })

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
      authorId: true,
    },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [session, podcast, episode, link, authors] = await Promise.all([
    sessionPromise,
    podcastPromise,
    episodePromise,
    linkPromise,
    authorsPromise,
  ])

  return json({ session, podcast, episode, link, authors })
}
