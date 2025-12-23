import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteCategory = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'article_category',
    execute: async () => {
      await prisma.articleCategory.delete({
        where: { id: options.id },
      })
    },
    target: options.target,
  })
