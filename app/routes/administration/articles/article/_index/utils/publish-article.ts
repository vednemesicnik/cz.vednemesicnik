import { invariantResponse } from '@epic-web/invariant'

import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'
import { needsReviewToPublish } from '~/utils/permissions/author/review-policy'

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
          authors: {
            select: {
              role: {
                select: {
                  publishRequiresReview: true,
                },
              },
            },
          },
          publishedAt: true,
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
      }) // TODO: Could be sent in form data to avoid this query?

      invariantResponse(
        !needsReviewToPublish({
          authors: article.authors,
          reviews: article.reviews,
        }),
        'Nelze publikovat bez schválení koordinátora',
      )

      const publishedAt = article.publishedAt ?? new Date()

      const updatedArticle = await prisma.article.update({
        data: { publishedAt, state: 'published' },
        select: { slug: true },
        where: { id: options.id },
      }) // TODO: If published by a Coordinator, auto-approve it

      // Update PageSEO state and publishedAt
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { publishedAt, state: 'published' },
        where: { pathname },
      })
    },
    target: options.target,
  })
