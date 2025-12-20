import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'podcast_episode_link',
    execute: async () => {
      // Get the link with author role and reviews
      const link = await prisma.podcastEpisodeLink.findUniqueOrThrow({
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

      // Check if author is not a Coordinator (level !== 1)
      const isNotCoordinator = link.author.role.level !== 1

      // If author is not a Coordinator, require Coordinator review
      if (isNotCoordinator) {
        const hasCoordinatorReview = link.reviews.some(
          (review) => review.reviewer.role.level === 1,
        )

        invariantResponse(
          hasCoordinatorReview,
          'Nelze publikovat bez schválení koordinátora',
        )
      }

      await prisma.podcastEpisodeLink.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      })
    },
    target: options.target,
  })
