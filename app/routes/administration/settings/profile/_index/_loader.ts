import { type LoaderFunctionArgs } from "react-router"

import { requireAuthentication } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          image: {
            select: {
              id: true,
              altText: true,
            },
          },
          sessions: {
            where: {
              id: {
                not: sessionId,
              },
              expirationDate: {
                gt: new Date(),
              },
            },
            select: {
              id: true,
            },
          },
        },
      },
    },
  })

  return { user: session.user, currentSession: { id: session.id } }
}
