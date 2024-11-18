import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const editoiralBoardMembers = await prisma.editorialBoardMember.findMany({
    select: {
      id: true,
      fullName: true,
      positions: {
        select: {
          id: true,
          key: true,
        },
      },
    },
  })

  return json({ editoiralBoardMembers })
}
