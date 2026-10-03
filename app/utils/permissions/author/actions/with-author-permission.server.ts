import { invariantResponse } from '@epic-web/invariant'
import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { data } from 'react-router'
import { requireSession } from '~/utils/auth.server'

import {
  type AuthorPermissionContext,
  getAuthorPermissionContext,
} from '../context/get-author-permission-context.server'

type Options<T> = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  target: { authorIds: string[]; state: ContentState }
  execute: (context: AuthorPermissionContext) => Promise<T>
}

export async function withAuthorPermission<T>(
  request: Request,
  options: Options<T>,
): Promise<T> {
  await requireSession(request)

  const context = await getAuthorPermissionContext(request, {
    actions: [options.action],
    entities: [options.entity],
  })

  invariantResponse(
    options.target.authorIds.length > 0,
    `Cannot determine permission target: ${options.entity} has no authors.`,
  )

  const { hasPermission } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.target.state,
    targetAuthorIds: options.target.authorIds,
  })

  // The generic denial (design 30h): no composed reason.
  if (!hasPermission) {
    throw data(null, { status: 403 })
  }

  return options.execute(context)
}
