import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const { podcastId, episodeId } = params

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

  return { session, podcast, episode, authors }
}
