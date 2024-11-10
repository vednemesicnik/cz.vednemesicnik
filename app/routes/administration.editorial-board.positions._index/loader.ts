import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const editoiralBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
        key: true,
        pluralLabel: true,
        order: true,
      },
    })

  return json({ editoiralBoardMemberPositions })
}
