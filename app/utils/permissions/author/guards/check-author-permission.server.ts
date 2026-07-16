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
  targetAuthorIds?: string[]
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
    targetAuthorIds: options.targetAuthorIds,
  })

  invariantResponse(
    hasPermission,
    options.errorMessage ?? 'Nemáte oprávnění k této akci.',
    { status: 403 },
  )

  return { hasAny, hasOwn }
}
