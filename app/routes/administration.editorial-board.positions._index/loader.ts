import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

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
