import type { UserPermissionContext } from '../context/get-user-permission-context.server'

type Target = {
  targetUserId: string
  targetUserRoleLevel: number
}

/**
 * Whether the signed-in user may edit an account in the users area (e-mail and
 * user role). Only access to any account counts: users are managed by the
 * Administrator and the Owner, anyone with rights over themselves only goes
 * through Settings (design 28, dj753f0j; 29a). The role hierarchy still applies,
 * so an Administrator cannot edit the Owner.
 *
 * @param userContext - The signed-in user's permission context.
 * @param target - The edited account and the role level checked against.
 * @returns `true` when the user may edit the account.
 */
export const canEditUser = (
  userContext: Pick<UserPermissionContext, 'can'>,
  { targetUserId, targetUserRoleLevel }: Target,
) => {
  const { hasAny, hasPermission } = userContext.can({
    action: 'update',
    entity: 'user',
    targetUserId,
    targetUserRoleLevel,
  })

  return hasAny && hasPermission
}
