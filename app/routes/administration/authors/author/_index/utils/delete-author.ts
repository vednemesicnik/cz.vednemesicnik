import { AUTHOR_REFERENCES_SELECT } from '~/utils/author-references/author-references-select'
import {
  type AuthorDeleteBlock,
  getAuthorDeleteBlock,
} from '~/utils/author-references/get-author-delete-block'
import { prisma } from '~/utils/db.server'
import { withUserPermission } from '~/utils/permissions/user/actions/with-user-permission.server'
import { publishAccountEvent } from '~/utils/sse/publish-account-event.server'

type Options = {
  id: string
  target: Parameters<typeof withUserPermission>[1]['target']
}

export type DeleteAuthorResult =
  | { status: 'deleted' }
  | { status: 'blocked'; deleteBlock: AuthorDeleteBlock }

/**
 * Deletes an author nothing holds (#767). The check and the delete share one
 * transaction: content holds the author on the database, and an article would
 * silently lose it from its authors, so an author standing on anything — or
 * with an account — is refused instead.
 *
 * @param request - The request, for the permission check.
 * @param options - The author's id and the account it belongs to, if any.
 * @returns `deleted`, or `blocked` with what holds the author now.
 */
export const deleteAuthor = (request: Request, options: Options) =>
  withUserPermission(request, {
    action: 'delete',
    entity: 'author',
    execute: async (context) => {
      const result = await prisma.$transaction(
        async (transaction): Promise<DeleteAuthorResult> => {
          const author = await transaction.author.findUniqueOrThrow({
            select: AUTHOR_REFERENCES_SELECT,
            where: { id: options.id },
          })

          const deleteBlock = getAuthorDeleteBlock(author, context.userId)

          if (!deleteBlock.deletable) {
            return { deleteBlock, status: 'blocked' }
          }

          await transaction.author.delete({ where: { id: options.id } })

          return { status: 'deleted' }
        },
      )

      // After the commit, so no receiver reloads before the author is gone.
      if (result.status === 'deleted') {
        publishAccountEvent({
          change: 'delete',
          entity: 'author',
          entityId: options.id,
        })
      }

      return result
    },
    target: options.target,
  })
