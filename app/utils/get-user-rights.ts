import type {
  UserPermissionAccess,
  UserPermissionAction,
  UserPermissionEntity,
} from "~~/types/permission"

type Access = UserPermissionAccess | string
type Action = UserPermissionAction | string
type Entity = UserPermissionEntity | string

type Permissions = {
  access: Access
  action: Action
  entity: Entity
}[]

type Options = {
  access?: Access[]
  actions?: Action[]
  entities?: Entity[]
  ownId?: string
  targetId?: string
}

/**
 * Determines the rights for given user permissions based on specified options.
 * Options could be omitted when the permissions are already filtered by database query.
 *
 * @param {Permissions} permissions - The list of permissions to evaluate.
 * @param {Options} [options] - Optional parameters to filter the permissions.
 * @param {Access[]} [options.access=["*"]] - The accesses to consider.
 * @param {Action[]} [options.actions=["*"]] - The actions to consider.
 * @param {Entity[]} [options.entities=["*"]] - The entities to consider.
 * @param {string} [options.ownId] - The ID of the person who is modifying the entity (used for "own" access level).
 * @param {string} [options.targetId] - The ID of the person whose entity is being modified (used for "own" access level).
 * @returns {boolean[][][]} A 3D array where each sub-array corresponds to the access levels for a specific action and entity, indicating whether the access level is permitted.
 *
 * @example
 * const [[[ hasUpdateAnyAuthorRight ]]] = getUserRights(permissions, { entities: ["author"], actions: ["update"], access: ["any"] })
 */
export const getUserRights = (
  permissions: Permissions,
  options?: Options
): boolean[][][] => {
  const {
    access = ["*"],
    actions = ["*"],
    entities = ["*"],
    ownId,
    targetId,
  } = options ?? {}

  return entities.map((entity) => {
    return actions.map((action) => {
      return access.map((access) => {
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

        if (access !== "*") {
          filteredPermissions = filteredPermissions.filter((permission) => {
            if (access === "own") {
              return access === permission.access && ownId === targetId
            } else {
              return access === permission.access
            }
          })
        }

        return filteredPermissions.length > 0
      })
    })
  })
}
