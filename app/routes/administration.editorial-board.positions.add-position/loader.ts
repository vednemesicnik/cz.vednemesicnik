import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await requireAuthentication(request)

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  return json({ editorialBoardPositionsCount })
}
