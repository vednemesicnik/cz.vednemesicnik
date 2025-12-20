import type {
  AuthorPermissionAccess,
  AuthorPermissionAction,
  AuthorPermissionEntity,
  ContentState,
} from '@generated/prisma/enums'

type Access = AuthorPermissionAccess | string
type Action = AuthorPermissionAction | string
type Entity = AuthorPermissionEntity | string
type State = ContentState | string

type Permissions = {
  access: Access
  action: Action
  entity: Entity
  state: State
}[]

type Options = {
  access?: Access[]
  actions?: Action[]
  entities?: Entity[]
  states?: State[]
  ownId?: string
  targetId?: string
}

/**
 * Determines the rights for given permissions based on specified options.
 * Options could be omitted when the permissions are already filtered by database query.
 *
 * @param {Permissions} permissions - The list of permissions to evaluate.
 * @param {Options} [options] - Optional parameters to filter the permissions.
 * @param {Access[]} [options.access=["*"]] - The access levels to consider.
 * @param {Action[]} [options.actions=["*"]] - The actions to consider.
 * @param {Entity[]} [options.entities=["*"]] - The entities to consider.
 * @param {State[]} [options.states=["*"]] - The states to consider.
 * @param {string} [options.ownId] - The ID of the author who is modifying the entity (used for "own" access level).
 * @param {string} [options.targetId] - The ID of the author whose entity is being modified (used for "own" access level).
 * @returns {boolean[][][][]} A 4D array where each sub-array corresponds to the states for a specific action and entity, indicating whether the state is permitted.
 *
 * @example
 * const [[[[hasArticleUpdateAnyDraftRight]]]] = getRights(permissions, { entities: ["article"], actions: ["update"], access: ["any"], states: ["draft"] })
 */
export const getAuthorRights = (
  permissions: Permissions,
  options?: Options,
): boolean[][][][] => {
  const {
    access = ['any'],
    actions = ['*'],
    entities = ['*'],
    states = ['*'],
    ownId,
    targetId,
  } = options ?? {}

  return entities.map((entity) => {
    return actions.map((action) => {
      return access.map((access) => {
        return states.map((state) => {
          let filteredPermissions = permissions

          if (entity !== '*') {
            filteredPermissions = filteredPermissions.filter(
              (permission) => entity === permission.entity,
            )
          }

          if (action !== '*') {
            filteredPermissions = filteredPermissions.filter(
              (permission) => action === permission.action,
            )
          }

          if (access !== '*') {
            filteredPermissions = filteredPermissions.filter((permission) => {
              if (access === 'own') {
                return access === permission.access && ownId === targetId
              } else {
                return access === permission.access
              }
            })
          }

          if (state !== '*') {
            filteredPermissions = filteredPermissions.filter(
              (permission) => state === permission.state,
            )
          }

          return filteredPermissions.length > 0
        })
      })
    })
  })
}
