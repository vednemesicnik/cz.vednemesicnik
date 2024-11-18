import { json, type LoaderFunctionArgs } from "@remix-run/node"
import type { ParamParseKey } from "@remix-run/router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

type RouteParams = Record<
  ParamParseKey<"administration/podcasts/:podcastId/add-episode">,
  string
>
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const { podcastId } = params as RouteParams

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { user: { select: { authorId: true } } },
  })

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

  const [session, podcast, authors] = await Promise.all([
    sessionPromise,
    podcastPromise,
    authorsPromise,
  ])

  return json({ session, podcast, authors })
}
