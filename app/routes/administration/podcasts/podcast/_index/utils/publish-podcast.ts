import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { needsReviewToPublish } from '~/utils/permissions/author/review-policy'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishPodcast = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'podcast',
    execute: async () => {
      // Get the podcast with author role and reviews
      const podcast = await prisma.podcast.findUniqueOrThrow({
        select: {
          author: {
            select: {
              role: {
                select: {
                  level: true,
                },
              },
            },
          },
          reviews: {
            select: {
              reviewer: {
                select: {
                  role: {
                    select: {
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: { id: options.id },
      })

      invariantResponse(
        !needsReviewToPublish({
          authors: [podcast.author],
          reviews: podcast.reviews,
        }),
        'Nelze publikovat bez schválení koordinátora',
      )

      await prisma.podcast.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      })
    },
    target: options.target,
  })
