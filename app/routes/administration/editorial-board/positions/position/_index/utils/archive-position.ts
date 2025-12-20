import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const archivePosition = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'archive',
    entity: 'editorial_board_position',
    execute: () =>
      prisma.editorialBoardPosition.update({
        data: { state: 'archived' },
        where: { id: options.id },
      }),
    target: options.target,
  })
