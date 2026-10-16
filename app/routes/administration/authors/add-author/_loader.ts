import type { LoaderFunctionArgs } from 'react-router'
import { data } from 'react-router'

import { getAllAuthorRoles } from '~/utils/permissions/author/queries/get-all-author-roles.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['create'],
    entities: ['author'],
  })

  // Check create permission
  const canCreate = context.can({
    action: 'create',
    entity: 'author',
  }).hasPermission

  // If user cannot create authors, they shouldn't access this page
  if (!canCreate) {
    throw data(null, { status: 403 })
  }

  const roles = await getAllAuthorRoles()

  // Opened from an article's author search (design 24j): the name typed
  // there, the article to go back to with the new author chosen, and the
  // author it replaces when the search was Vyměnit za (ivyin4kr).
  const searchParams = new URL(request.url).searchParams

  return {
    articleId: searchParams.get('article') || null,
    name: searchParams.get('name') ?? '',
    replacedAuthorId: searchParams.get('replace') || null,
    roles,
  }
}
