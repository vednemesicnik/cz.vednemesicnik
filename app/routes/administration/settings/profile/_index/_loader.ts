import type { LoaderFunctionArgs } from 'react-router'

import { requireAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication(request)

  const session = await prisma.session.findUniqueOrThrow({
    select: {
      id: true,
      user: {
        select: {
          email: true,
          id: true,
          image: {
            select: {
              altText: true,
              id: true,
            },
          },
          name: true,
          sessions: {
            select: {
              id: true,
            },
            where: {
              expirationDate: {
                gt: new Date(),
              },
              id: {
                not: sessionId,
              },
            },
          },
          username: true,
        },
      },
    },
    where: { id: sessionId },
  })

  return { currentSession: { id: session.id }, user: session.user }
}
