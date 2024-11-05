import { json } from "@remix-run/node"

import { prisma } from "~/utils/db.server"

export const loader = async () => {
  const podcasts = await prisma.podcast.findMany({
    select: {
      id: true,
      title: true,
    },
  })

  return json({ podcasts })
}
