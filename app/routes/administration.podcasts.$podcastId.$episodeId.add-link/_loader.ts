import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/:episodeId/add-link">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const { podcastId, episodeId } = params as RouteParams

  const sessionPromise = await prisma.session.findUniqueOrThrow({
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

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [session, podcast, episode, authors] = await Promise.all([
    sessionPromise,
    podcastPromise,
    episodePromise,
    authorsPromise,
  ])

  return json({ session, podcast, episode, authors })
}
