import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const restoreMember = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'restore',
    entity: 'editorial_board_member',
    execute: () =>
      prisma.editorialBoardMember.update({
        data: {
          publishedAt: null,
          reviews: {
            deleteMany: {}, // Delete all reviews for this member
          },
          state: 'draft',
        },
        where: { id: options.id },
      }),
    target: options.target,
  })
