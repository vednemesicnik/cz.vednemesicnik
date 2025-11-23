import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  await requireAuthentication(request)

  const { podcastId } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      episodes: {
        select: {
          id: true,
          title: true,
          publishedAt: true,
          state: true,
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  })

  return { podcast }
}
