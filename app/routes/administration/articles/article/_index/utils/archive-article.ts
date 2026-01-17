import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const archiveArticle = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'archive',
    entity: 'article',
    execute: async () => {
      const updatedArticle = await prisma.article.update({
        data: { state: 'archived' },
        select: { slug: true },
        where: { id: options.id },
      })

      // Update PageSEO state
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { state: 'archived' },
        where: { pathname },
      })
    },
    target: options.target,
  })
