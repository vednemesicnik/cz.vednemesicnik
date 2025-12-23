import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteTag = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'article_tag',
    execute: async () => {
      await prisma.articleTag.delete({
        where: { id: options.id },
      })
    },
    target: options.target,
  })
