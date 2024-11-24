import { type AuthorPermission, type UserPermission } from "@prisma/client"

import {
  type AuthorPermissionAccess,
  type AuthorPermissionAction,
  type AuthorPermissionEntity,
  type UserPermissionAccess,
  type UserPermissionAction,
  type UserPermissionEntity,
} from "~~/types/permission"

type Permissions = Pick<
  UserPermission | AuthorPermission,
  "access" | "action" | "entity"
>[]

type Options = {
  access?: (UserPermissionAccess | AuthorPermissionAccess | string)[]
  actions?: (UserPermissionAction | AuthorPermissionAction | string)[]
  entities?: (UserPermissionEntity | AuthorPermissionEntity | string)[]
  ownId?: string
  targetId?: string
}

export const getRights = (permissions: Permissions, options?: Options) => {
  const {
    access = ["any"],
    actions = [],
    entities = ["*"],
    ownId,
    targetId,
  } = options ?? {}

  return entities.map((entity) => {
    let filteredPermissions = permissions

    if (entity !== "*") {
      filteredPermissions = filteredPermissions.filter(
        (permission) => entity === permission.entity
      )
    }

    if (actions.length > 0) {
      filteredPermissions = filteredPermissions.filter((permission) =>
        actions.includes(permission.action)
      )
    }

    filteredPermissions = filteredPermissions.filter((permission) =>
      access.includes(permission.access)
    )

    return filteredPermissions.some(
      (permission) =>
        permission.access === "any" ||
        (permission.access === "own" && ownId === targetId)
    )
  })
}
