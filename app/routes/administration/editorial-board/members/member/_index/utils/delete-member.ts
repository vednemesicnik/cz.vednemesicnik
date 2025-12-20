import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteMember = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'editorial_board_member',
    execute: () =>
      prisma.editorialBoardMember.delete({ where: { id: options.id } }),
    target: options.target,
  })
