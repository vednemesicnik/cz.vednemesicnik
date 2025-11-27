import { prisma } from "~/utils/db.server"

import type { Route } from "../index/+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: { title: true },
  })

  return { podcast }
}
