import { invariantResponse } from '@epic-web/invariant'

import type {
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'
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
  errorMessage?: string
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

  invariantResponse(
    hasPermission,
    options.errorMessage ?? 'Nemáte oprávnění k této akci.',
    { status: 403 },
  )

  return options.execute(context)
}
