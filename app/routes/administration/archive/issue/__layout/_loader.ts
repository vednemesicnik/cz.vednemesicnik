import { prisma } from "~/utils/db.server"

import type { Route } from "./+types/route"

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { issueId } = params

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: {
      id: true,
      label: true,
    },
  })

  return { issue }
}
