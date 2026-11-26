import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { canChooseRecordAuthor } from '../../utils/can-choose-record-author'
import { getNewRecordPrimaryIntent } from '../../utils/get-new-record-primary-intent'
import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['article_category'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'article_category',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  return {
    // Only the Coordinator picks the author (design 25c, iq3nur0e).
    authors: canChooseRecordAuthor(context.roleLevel)
      ? await getAuthorsByPermission(
          context,
          'article_category',
          'create',
          'draft',
        )
      : null,
    primaryIntent: getNewRecordPrimaryIntent(context.roleLevel),
    selfAuthorId: context.authorId,
  }
}
