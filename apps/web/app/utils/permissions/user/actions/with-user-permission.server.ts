import type {
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'
import { data } from 'react-router'
import { requireSession } from '~/utils/auth.server'

import {
  getUserPermissionContext,
  type UserPermissionContext,
} from '../context/get-user-permission-context.server'

type Options<T> = {
  entity: UserPermissionEntity
  action: UserPermissionAction
  target: {
    userId?: string
    roleLevel?: number
  }
  execute: (context: UserPermissionContext) => Promise<T>
}

export async function withUserPermission<T>(
  request: Request,
  options: Options<T>,
): Promise<T> {
  await requireSession(request)

  const context = await getUserPermissionContext(request, {
    actions: [options.action],
    entities: [options.entity],
  })

  const { hasPermission } = context.can({
    action: options.action,
    entity: options.entity,
    targetUserId: options.target.userId,
    targetUserRoleLevel: options.target.roleLevel,
  })

  // The generic denial (design 30h): no composed reason.
  if (!hasPermission) {
    throw data(null, { status: 403 })
  }

  return options.execute(context)
}
