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

/**
 * Determines the rights for given permissions based on specified options.
 *
 * @param {Permissions} permissions - The list of permissions to evaluate.
 * @param {Options} [options] - Optional parameters to filter the permissions.
 * @param {Array<UserPermissionEntity | AuthorPermissionEntity | string>} [options.entities=["*"]] - The entities to consider.
 * @param {Array<UserPermissionAction | AuthorPermissionAction | string>} [options.actions=["*"]] - The actions to consider.
 * @param {Array<UserPermissionAccess | AuthorPermissionAccess | string>} [options.access=["any"]] - The access levels to consider.
 * @param {string} [options.ownId] - The ID of the owner (used for "own" access level).
 * @param {string} [options.targetId] - The ID of the target (used for "own" access level).
 * @returns {boolean[][]} A 2D array where each sub-array corresponds to the actions for a specific entity, indicating whether the action is permitted.
 */
export const getRights = (permissions: Permissions, options?: Options) => {
  const {
    access = ["any"],
    actions = ["*"],
    entities = ["*"],
    ownId,
    targetId,
  } = options ?? {}

  return entities.map((entity) => {
    return actions.map((action) => {
      let filteredPermissions = permissions

      if (entity !== "*") {
        filteredPermissions = filteredPermissions.filter(
          (permission) => entity === permission.entity
        )
      }

      if (action !== "*") {
        filteredPermissions = filteredPermissions.filter(
          (permission) => action === permission.action
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
  })
}
