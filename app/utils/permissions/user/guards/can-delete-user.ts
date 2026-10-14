import type { UserPermissionContext } from '../context/get-user-permission-context.server'

// The Owner's role level; exactly one Owner exists, from the seed.
const OWNER_ROLE_LEVEL = 1

type Target = {
  targetUserId: string
  targetUserRoleLevel: number
}

/**
 * Whether the signed-in user is offered deleting an account (design 28g):
 * never their own account and never the Owner's, on top of the permission and
 * the role hierarchy.
 *
 * @param userContext - The signed-in user's permission context.
 * @param target - The account and its role level.
 * @returns `true` when „Smazat…“ belongs on the account.
 */
export const canDeleteUser = (
  userContext: Pick<UserPermissionContext, 'can' | 'userId'>,
  { targetUserId, targetUserRoleLevel }: Target,
) => {
  if (
    targetUserId === userContext.userId ||
    targetUserRoleLevel === OWNER_ROLE_LEVEL
  ) {
    return false
  }

  return userContext.can({
    action: 'delete',
    entity: 'user',
    targetUserId,
    targetUserRoleLevel,
  }).hasPermission
}
