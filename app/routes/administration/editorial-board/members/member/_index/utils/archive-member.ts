import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const archiveMember = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'archive',
    entity: 'editorial_board_member',
    execute: () =>
      prisma.editorialBoardMember.update({
        data: { state: 'archived' },
        where: { id: options.id },
      }),
    target: options.target,
  })
