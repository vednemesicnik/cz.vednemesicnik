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
  targetAuthorIds?: string[]
  redirectTo?: string
}

export function requireAuthorPermission(
  context: AuthorPermissionContext,
  options: RequireAuthorPermissionOptions,
) {
  let effectiveTargetAuthorId = options.targetAuthorId
  if (options.targetAuthorIds !== undefined) {
    if (options.targetAuthorIds.length === 0) {
      throw redirect(options.redirectTo ?? '/administration')
    }
    effectiveTargetAuthorId = options.targetAuthorIds.includes(context.authorId)
      ? context.authorId
      : options.targetAuthorIds[0]
  }

  const { hasPermission, hasOwn, hasAny } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.state,
    targetAuthorId: effectiveTargetAuthorId,
  })

  if (!hasPermission) {
    // TODO: add flash message about insufficient permissions
    throw redirect(options.redirectTo ?? '/administration')
  }

  return { hasAny, hasOwn }
}
