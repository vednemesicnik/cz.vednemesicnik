import { invariantResponse } from '@epic-web/invariant'

import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

type RequireAuthorPermissionOptions = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  state?: ContentState
  targetAuthorIds?: string[]
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

  invariantResponse(hasPermission, 'Nemáte oprávnění k této akci.', {
    status: 403,
  })

  return { hasAny, hasOwn }
}
