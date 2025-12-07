import { invariantResponse } from "@epic-web/invariant"

import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from "@generated/prisma/enums"
import { requireAuthentication } from "~/utils/auth.server"

import {
  type AuthorPermissionContext,
  getAuthorPermissionContext,
} from "../context/get-author-permission-context.server"

export async function withAuthorPermission<T>(
  request: Request,
  options: {
    entity: AuthorPermissionEntity
    action: AuthorPermissionAction
    getTarget: () => Promise<{ authorId: string; state: ContentState }>
    execute: (context: AuthorPermissionContext) => Promise<T>
    errorMessage?: string
  }
): Promise<T> {
  await requireAuthentication(request)

  const context = await getAuthorPermissionContext(request, {
    entities: [options.entity],
    actions: [options.action],
  })

  const target = await options.getTarget()

  const { hasPermission } = context.can({
    entity: options.entity,
    action: options.action,
    state: target.state,
    targetAuthorId: target.authorId,
  })

  invariantResponse(
    hasPermission,
    options.errorMessage ??
      `You do not have permission to ${options.action} this ${options.entity}.`
  )

  return options.execute(context)
}
