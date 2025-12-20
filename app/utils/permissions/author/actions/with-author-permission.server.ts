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

type Options<T> = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  target: { authorId: string; state: ContentState }
  execute: (context: AuthorPermissionContext) => Promise<T>
  errorMessage?: string
}

export async function withAuthorPermission<T>(
  request: Request,
  options: Options<T>
): Promise<T> {
  await requireAuthentication(request)

  const context = await getAuthorPermissionContext(request, {
    entities: [options.entity],
    actions: [options.action],
  })

  const { hasPermission } = context.can({
    entity: options.entity,
    action: options.action,
    state: options.target.state,
    targetAuthorId: options.target.authorId,
  })

  invariantResponse(
    hasPermission,
    options.errorMessage ??
      `You do not have permission to ${options.action} this ${options.entity}.`
  )

  return options.execute(context)
}
