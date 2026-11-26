import type { UserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'

/**
 * Whether the sidebar lists a people section (Uživatelé, Autoři). Only access to
 * other people's records counts: with access to one's own only, the list would hold
 * a single row (design 22a, dj753f0j).
 *
 * @param userContext - The signed-in user's permission context.
 * @param entity - The people entity behind the sidebar item.
 * @returns `true` when the user may view any record of the entity.
 */
export const canListPeople = (
  userContext: Pick<UserPermissionContext, 'can'>,
  entity: 'user' | 'author',
) => userContext.can({ action: 'view', entity }).hasAny
