import type { UserPermissionContext } from '../context/get-user-permission-context.server'
import { canEditUser } from './can-edit-user'

// The Owner's role level; the Owner has the emergency password instead.
const OWNER_ROLE_LEVEL = 1

type Target = {
  targetUserId: string
  targetUserRoleLevel: number
}

/**
 * Whether the signed-in user may issue an emergency sign-in link for an account
 * (#578, design 28e): only for an account they may edit, never for their own
 * and never for the Owner's. Whether the emergency mode is on is checked
 * separately.
 *
 * @param userContext - The signed-in user's permission context.
 * @param target - The account and its role level.
 * @returns `true` when „Vydat nouzový odkaz…“ belongs on the account.
 */
export const canIssueEmergencySignInLink = (
  userContext: Pick<UserPermissionContext, 'can' | 'userId'>,
  target: Target,
) => {
  if (
    target.targetUserId === userContext.userId ||
    target.targetUserRoleLevel === OWNER_ROLE_LEVEL
  ) {
    return false
  }

  return canEditUser(userContext, target)
}
