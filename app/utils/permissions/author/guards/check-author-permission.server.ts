import { invariantResponse } from '@epic-web/invariant'

import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

type CheckAuthorPermissionOptions = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  state?: ContentState
  targetAuthorId?: string
  errorMessage?: string
}

export function checkAuthorPermission(
  context: AuthorPermissionContext,
  options: CheckAuthorPermissionOptions,
) {
  const { hasPermission, hasOwn, hasAny } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.state,
    targetAuthorId: options.targetAuthorId,
  })

  invariantResponse(
    hasPermission,
    options.errorMessage ??
      `You do not have permission to ${options.action} this ${options.entity}.`,
  )

  return { hasAny, hasOwn }
}
