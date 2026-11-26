import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { data } from 'react-router'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'

type CheckAuthorPermissionOptions = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  state?: ContentState
  targetAuthorIds?: string[]
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

  // The generic denial (design 30h): no composed reason.
  if (!hasPermission) {
    throw data(null, { status: 403 })
  }

  return { hasAny, hasOwn }
}
