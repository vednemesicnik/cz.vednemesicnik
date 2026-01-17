import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const retractArticle = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'retract',
    entity: 'article',
    execute: async () => {
      const updatedArticle = await prisma.article.update({
        data: { publishedAt: null, state: 'draft' },
        select: { slug: true },
        where: { id: options.id },
      })

      // Update PageSEO state and clear publishedAt
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { publishedAt: null, state: 'draft' },
        where: { pathname },
      })
    },
    target: options.target,
  })
