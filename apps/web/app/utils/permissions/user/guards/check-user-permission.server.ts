import type {
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'
import { data } from 'react-router'

import type { UserPermissionContext } from '../context/get-user-permission-context.server'

type CheckUserPermissionOptions = {
  entity: UserPermissionEntity
  action: UserPermissionAction
  targetUserId?: string
  targetUserRoleLevel?: number
}

export function checkUserPermission(
  context: UserPermissionContext,
  options: CheckUserPermissionOptions,
) {
  const { hasPermission, hasOwn, hasAny } = context.can({
    action: options.action,
    entity: options.entity,
    targetUserId: options.targetUserId,
    targetUserRoleLevel: options.targetUserRoleLevel,
  })

  // The generic denial (design 30h): no composed reason.
  if (!hasPermission) {
    throw data(null, { status: 403 })
  }

  return { hasAny, hasOwn }
}
