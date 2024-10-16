import { json, type LoaderFunctionArgs, redirect } from "@remix-run/node"

import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const editorialBoardMemberPositions =
    await prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  return json({ editorialBoardMemberPositions })
}
