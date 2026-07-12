import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { needsReviewToPublish } from '~/utils/permissions/author/review-policy'

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
          authors: [issue.author],
          reviews: issue.reviews,
        }),
        'Nelze publikovat bez schválení koordinátora',
      )

      await prisma.issue.update({
        data: { publishedAt: new Date(), state: 'published' },
        where: { id: options.id },
      })
    },
    target: options.target,
  })
