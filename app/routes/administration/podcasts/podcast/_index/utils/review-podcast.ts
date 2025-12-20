import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const reviewPodcast = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'review',
    entity: 'podcast',
    execute: async (context) => {
      const reviewerId = context.authorId

      // Check if the reviewer has already reviewed this podcast
      const existingReview = await prisma.review.findFirst({
        where: {
          podcastId: options.id,
          reviewerId,
        },
      })

      // If no existing review, create one
      if (!existingReview) {
        await prisma.review.create({
          data: {
            podcastId: options.id,
            reviewerId,
            state: 'approved',
          },
        })
      }
    },
    target: options.target,
  })
