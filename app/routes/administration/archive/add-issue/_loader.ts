import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['create'],
    entities: ['issue'],
  })

  requireAuthorPermission(context, {
    action: 'create',
    entity: 'issue',
    state: 'draft',
    targetAuthorIds: [context.authorId],
  })

  const authors = await getAuthorsByPermission(
    context,
    'issue',
    'create',
    'draft',
  )

  return {
    authors,
    // The year in Prague, so New Year's Eve after 23:00 UTC is already the new one.
    currentYear: Number(
      new Intl.DateTimeFormat('cs-CZ', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
      }).format(new Date()),
    ),
    selfAuthorId: context.authorId,
  }
}
