import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishIssue = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'issue',
    execute: async () => {
      // Get the issue with author role and reviews
      const issue = await prisma.issue.findUniqueOrThrow({
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
      const isNotCoordinator = issue.author.role.level !== 1

      // If author is not a Coordinator, require Coordinator review
      if (isNotCoordinator) {
        const hasCoordinatorReview = issue.reviews.some(
          (review) => review.reviewer.role.level === 1,
        )

        invariantResponse(
          hasCoordinatorReview,
          'Nelze publikovat bez schválení koordinátora',
        )
      }

      await prisma.issue.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      })
    },
    target: options.target,
  })
