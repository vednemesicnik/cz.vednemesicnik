import { invariantResponse } from '@epic-web/invariant'

import type {
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'

import type { UserPermissionContext } from '../context/get-user-permission-context.server'

type CheckUserPermissionOptions = {
  entity: UserPermissionEntity
  action: UserPermissionAction
  targetUserId?: string
  targetUserRoleLevel?: number
  errorMessage?: string
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

  invariantResponse(
    hasPermission,
    options.errorMessage ??
      `You do not have permission to ${options.action} this ${options.entity}.`,
  )

  return { hasAny, hasOwn }
}
