import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { user: { select: { authorId: true } } },
  })

  const { podcastId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      cover: {
        select: {
          id: true,
        },
      },
    },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [session, podcast, authors] = await Promise.all([
    sessionPromise,
    podcastPromise,
    authorsPromise,
  ])

  return { session, podcast, authors }
}
