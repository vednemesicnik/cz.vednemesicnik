import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { needsReviewToPublish } from '~/utils/permissions/author/review-policy'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishEpisode = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'podcast_episode',
    execute: async () => {
      // Get the episode with author role and reviews
      const episode = await prisma.podcastEpisode.findUniqueOrThrow({
        select: {
          author: {
            select: {
              role: {
                select: {
                  publishRequiresReview: true,
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
                      publishRequiresReview: true,
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
          authors: [episode.author],
          reviews: episode.reviews,
        }),
        'Nelze publikovat bez schválení koordinátora',
      )

      await prisma.podcastEpisode.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      })
    },
    target: options.target,
  })
