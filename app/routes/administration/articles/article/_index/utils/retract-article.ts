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
    execute: () =>
      prisma.article.update({
        data: { state: 'draft' },
        where: { id: options.id },
      }),
    target: options.target,
  })
