import { data } from 'react-router'

import { getAllAuthorRoles } from '~/utils/permissions/author/queries/get-all-author-roles.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { getAuthorRoleLabel } from '~/utils/role-labels'
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

  const [authorRoles, authorsWithoutUser] = await Promise.all([
    getAllAuthorRoles(),
    getAuthorsWithoutUser(),
  ])

  // Založit účet… on an author opens the form with that author chosen (28a,
  // 28b); an author who has an account by now isn't offered.
  const authorParam = url.searchParams.get('author')
  const preselectedAuthorId =
    authorsWithoutUser.find((author) => author.id === authorParam)?.id ?? null

  return {
    authorRoles,
    // Name and role come from the author, the role in Czech (28f).
    authorsWithoutUser: authorsWithoutUser.map((author) => ({
      id: author.id,
      name: author.name,
      roleLabel: getAuthorRoleLabel(author.role.name),
    })),
    // The least permission, as on Nový autor (28c).
    defaultAuthorRoleId:
      authorRoles.find((role) => role.name === 'contributor')?.id ??
      authorRoles[0].id,
    preselectedAuthorId,
  }
}
