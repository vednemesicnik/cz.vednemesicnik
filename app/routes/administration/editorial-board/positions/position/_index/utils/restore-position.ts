import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const restorePosition = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'restore',
    entity: 'editorial_board_position',
    execute: () =>
      prisma.editorialBoardPosition.update({
        data: {
          publishedAt: null,
          reviews: {
            deleteMany: {}, // Delete all reviews for this position
          },
          state: 'draft',
        },
        where: { id: options.id },
      }),
    target: options.target,
  })
