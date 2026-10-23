import { data } from 'react-router'

import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { getAssignableRoles } from '~/utils/permissions/user/queries/get-assignable-roles.server'

import type { Route } from './+types/route'
import { getAuthorsWithoutUser } from './utils/get-authors-without-user.server'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['create'],
    entities: ['user'],
  })

  // Check create permission
  const canCreate = context.can({
    action: 'create',
    entity: 'user',
    targetUserId: context.userId,
  }).hasPermission

  // If user cannot create users, they shouldn't access this page
  if (!canCreate) {
    throw data(null, { status: 403 })
  }

  const [roles, authorsWithoutUser] = await Promise.all([
    getAssignableRoles(context),
    getAuthorsWithoutUser(),
  ])

  // Založit účet… on an author opens the form with that author chosen (28a,
  // 28b); an author who has an account by now isn't offered.
  const authorParam = url.searchParams.get('author')
  const preselectedAuthorId =
    authorsWithoutUser.find((author) => author.id === authorParam)?.id ?? null

  return { authorsWithoutUser, preselectedAuthorId, roles }
}
