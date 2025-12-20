import { prisma } from '~/utils/db.server'
import { withUserPermission } from '~/utils/permissions/user/actions/with-user-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withUserPermission>[1]['target']
}

export const deleteAuthor = (request: Request, options: Options) =>
  withUserPermission(request, {
    action: 'delete',
    entity: 'author',
    execute: async () => {
      await prisma.author.delete({ where: { id: options.id } })
    },
    target: options.target,
  })
