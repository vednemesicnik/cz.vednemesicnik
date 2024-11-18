import { json, type LoaderFunctionArgs } from "@remix-run/node"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const sessionPromise = prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: { user: { select: { authorId: true } } },
  })

  const editorialBoardMemberPositionsPromise =
    prisma.editorialBoardPosition.findMany({
      select: {
        id: true,
        key: true,
      },
    })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [session, editorialBoardMemberPositions, authors] = await Promise.all([
    sessionPromise,
    editorialBoardMemberPositionsPromise,
    authorsPromise,
  ])

  return json({ session, editorialBoardMemberPositions, authors })
}
