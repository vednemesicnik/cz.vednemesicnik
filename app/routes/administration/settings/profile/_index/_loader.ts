import type { LoaderFunctionArgs } from 'react-router'

import { requireAuthentication } from '~/utils/auth.server'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'

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
            select: imageSourceSelect,
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

  const user = {
    ...session.user,
    image: {
      altText: session.user.image?.altText ?? '',
      sources: createImageSources('user-image', session.user.image),
    },
  }

  return { currentSession: { id: session.id }, user }
}
