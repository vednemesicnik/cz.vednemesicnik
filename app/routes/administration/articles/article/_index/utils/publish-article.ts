import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const publishArticle = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'publish',
    entity: 'article',
    execute: async () => {
      // Get the article with author role and reviews
      const article = await prisma.article.findUniqueOrThrow({
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
      const isNotCoordinator = article.author.role.level !== 1

      // If author is not a Coordinator, require Coordinator review
      if (isNotCoordinator) {
        const hasCoordinatorReview = article.reviews.some(
          (review) => review.reviewer.role.level === 1,
        )

        invariantResponse(
          hasCoordinatorReview,
          'Nelze publikovat bez schválení koordinátora',
        )
      }

      const updatedArticle = await prisma.article.update({
        data: { publishedAt: new Date(), state: 'published' },
        select: { slug: true },
        where: { id: options.id },
      }) // TODO: If published by a Coordinator, auto-approve it

      // Update PageSEO state and publishedAt
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { publishedAt: new Date(), state: 'published' },
        where: { pathname },
      })
    },
    target: options.target,
  })
