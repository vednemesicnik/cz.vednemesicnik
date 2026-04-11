import { invariantResponse } from '@epic-web/invariant'

import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'
import { requireAuthentication } from '~/utils/auth.server'

import {
  type AuthorPermissionContext,
  getAuthorPermissionContext,
} from '../context/get-author-permission-context.server'

type Options<T> = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  target: { authorIds: string[]; state: ContentState }
  execute: (context: AuthorPermissionContext) => Promise<T>
  errorMessage?: string
}

export async function withAuthorPermission<T>(
  request: Request,
  options: Options<T>,
): Promise<T> {
  await requireAuthentication(request)

  const context = await getAuthorPermissionContext(request, {
    actions: [options.action],
    entities: [options.entity],
  })

  invariantResponse(
    options.target.authorIds.length > 0,
    `Cannot determine permission target: ${options.entity} has no authors.`,
  )

  const effectiveTargetAuthorId = options.target.authorIds.includes(
    context.authorId,
  )
    ? context.authorId
    : options.target.authorIds[0]

  const { hasPermission } = context.can({
    action: options.action,
    entity: options.entity,
    state: options.target.state,
    targetAuthorId: effectiveTargetAuthorId,
  })

  invariantResponse(
    hasPermission,
    options.errorMessage ??
      `You do not have permission to ${options.action} this ${options.entity}.`,
  )

  return options.execute(context)
}
