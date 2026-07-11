import { invariantResponse } from '@epic-web/invariant'

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
  targetAuthorIds?: string[]
  redirectTo?: string
}

export function requireAuthorPermission(
  context: AuthorPermissionContext,
  options: RequireAuthorPermissionOptions,
) {
  if (options.targetAuthorIds !== undefined) {
    invariantResponse(
      options.targetAuthorIds.length > 0,
      `Cannot determine permission target: ${options.entity} has no authors.`,
    )
  }

  const { hasPermission, hasOwn, hasAny } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.state,
    targetAuthorIds: options.targetAuthorIds,
  })

  if (!hasPermission) {
    // TODO: add flash message about insufficient permissions
    throw redirect(options.redirectTo ?? '/administration')
  }

  return { hasAny, hasOwn }
}
