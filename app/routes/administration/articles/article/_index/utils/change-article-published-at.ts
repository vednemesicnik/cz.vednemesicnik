import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

import { assertCanSetPublishedAt } from './assert-can-set-published-at'

type Options = {
  id: string
  publishedAt: Date
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const changeArticlePublishedAt = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    // Closest existing grant over a published article; there is no
    // `update published` row, and the level gate below narrows it further.
    action: 'retract',
    entity: 'article',
    execute: async (context) => {
      assertCanSetPublishedAt(context, options.publishedAt)

      const updatedArticle = await prisma.article.update({
        data: { publishedAt: options.publishedAt },
        select: { slug: true },
        where: { id: options.id },
      })

      // Keep SEO metadata (article:published_time) in sync
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { publishedAt: options.publishedAt },
        where: { pathname },
      })
    },
    target: options.target,
  })
