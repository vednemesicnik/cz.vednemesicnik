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
      // Null publishedAt on retract so drafts have no date until (re)published,
      // matching the other retract utils (tag, category, issue, podcast, …).
      const updatedArticle = await prisma.article.update({
        data: { publishedAt: null, state: 'draft' },
        select: { slug: true },
        where: { id: options.id },
      })

      // Update PageSEO state and publishedAt
      const pathname = `/articles/${updatedArticle.slug}`
      await prisma.pageSEO.updateMany({
        data: { publishedAt: null, state: 'draft' },
        where: { pathname },
      })
    },
    target: options.target,
  })
