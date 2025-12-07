import { redirect } from "react-router"

import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from "@generated/prisma/enums"

import type { AuthorPermissionContext } from "../context/get-author-permission-context.server"

type RequireAuthorPermissionOptions = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  state?: ContentState
  targetAuthorId?: string
  redirectTo?: string
}

export function requireAuthorPermission(
  context: AuthorPermissionContext,
  options: RequireAuthorPermissionOptions
) {
  const { hasPermission, hasOwn, hasAny } = context.can({
    entity: options.entity,
    action: options.action,
    state: options.state,
    targetAuthorId: options.targetAuthorId,
  })

  if (!hasPermission) {
    throw redirect(options.redirectTo ?? "/administration")
  }

  return { hasOwn, hasAny }
}
