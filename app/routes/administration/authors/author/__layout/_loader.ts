import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { authorId } = params

  const author = await prisma.author.findUniqueOrThrow({
    where: { id: authorId },
    select: {
      id: true,
      name: true,
    },
  })

  return { author }
}