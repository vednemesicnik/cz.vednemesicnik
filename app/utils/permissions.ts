import { type Permission } from "@prisma/client"

import {
  type PermissionAccess,
  type PermissionAction,
  type PermissionEntity,
} from "~~/types/permission"

// access: "own" | "any"
// action: "create" | "read" | "update" | "delete" | "publish"

type Permissions = Pick<Permission, "access" | "action" | "entity">[]

type Options = {
  access?: (PermissionAccess | string)[]
  actions?: (PermissionAction | string)[]
  entities?: (PermissionEntity | string)[]
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
      filteredPermissions = filteredPermissions.filter((permission) =>
        entities.includes(permission.entity)
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
