import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const podcasts = await prisma.podcast.findMany({
    select: {
      id: true,
      title: true,
    },
  })

  return json({ podcasts })
}
