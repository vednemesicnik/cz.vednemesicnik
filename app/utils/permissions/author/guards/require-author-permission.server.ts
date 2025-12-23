import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { redirect } from 'react-router'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

type RequireAuthorPermissionOptions = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  state?: ContentState
  targetAuthorId?: string
  redirectTo?: string
}

export function requireAuthorPermission(
  context: AuthorPermissionContext,
  options: RequireAuthorPermissionOptions,
) {
  const { hasPermission, hasOwn, hasAny } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.state,
    targetAuthorId: options.targetAuthorId,
  })

  if (!hasPermission) {
    // TODO: add flash message about insufficient permissions
    throw redirect(options.redirectTo ?? '/administration')
  }

  return { hasAny, hasOwn }
}
