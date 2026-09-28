import type { UserPermissionContext } from '../../user/context/get-user-permission-context.server'

/**
 * Whether the current user may change an author's role: requires `update`
 * on `author` with `any` access. Editing only one's own author profile
 * (`own` access) never allows changing its role.
 *
 * @param context - User permission context loaded with `update` on `author`.
 * @returns `true` when the role may be changed.
 */
export const canChangeAuthorRole = (context: UserPermissionContext) =>
  context.can({ action: 'update', entity: 'author' }).hasAny
