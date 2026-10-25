import { getAllAuthorRoles } from '~/utils/permissions/author/queries/get-all-author-roles.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { checkUserPermission } from '~/utils/permissions/user/guards/check-user-permission.server'
import type { Route } from './+types/route'

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['create'],
    entities: ['author'],
  })

  // Only the Administrator and the Owner create authors (28c, 2re069d4).
  checkUserPermission(context, { action: 'create', entity: 'author' })

  const roles = await getAllAuthorRoles()

  // Opened from an article's author search (design 24j): the name typed
  // there, the article to go back to with the new author chosen, and the
  // author it replaces when the search was Vybrat jiného autora (ivyin4kr).
  const { searchParams } = url

  return {
    articleId: searchParams.get('article') || null,
    // The least permission, as a new account's author (28c).
    defaultRoleId:
      roles.find((role) => role.name === 'contributor')?.id ?? roles[0].id,
    name: searchParams.get('name') ?? '',
    replacedAuthorId: searchParams.get('replace') || null,
    roles,
  }
}
