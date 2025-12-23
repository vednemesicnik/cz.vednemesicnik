import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishTag = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'article_tag',
    execute: async () => {
      // Get the tag with author role and reviews
      const tag = await prisma.articleTag.findUniqueOrThrow({
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
      }) // TODO: Could be sent in form data to avoid this query?

      // Check if author is not a Coordinator (level !== 1)
      const isNotCoordinator = tag.author.role.level !== 1

      // If author is not a Coordinator, require Coordinator review
      if (isNotCoordinator) {
        const hasCoordinatorReview = tag.reviews.some(
          (review) => review.reviewer.role.level === 1,
        )

        invariantResponse(
          hasCoordinatorReview,
          'Nelze publikovat bez schválení koordinátora',
        )
      }

      await prisma.articleTag.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      }) // TODO: If published by a Coordinator, auto-approve it
    },
    target: options.target,
  })
