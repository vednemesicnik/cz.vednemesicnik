import { type LoaderFunctionArgs } from "react-router";

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      user: {
        select: {
          authorId: true,
        },
      },
    },
  })

  const authors = await prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const editorialBoardPositionsCount =
    await prisma.editorialBoardPosition.count()

  return { editorialBoardPositionsCount, session, authors }
}
