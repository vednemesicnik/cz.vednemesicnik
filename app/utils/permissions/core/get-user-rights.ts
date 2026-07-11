import type {
  UserPermissionAccess,
  UserPermissionAction,
  UserPermissionEntity,
} from '@generated/prisma/enums'

type Access = UserPermissionAccess | string
type Action = UserPermissionAction | string
type Entity = UserPermissionEntity | string

type Permissions = {
  access: Access
  action: Action
  entity: Entity
}[]

type Options = {
  action: Action
  entity: Entity
  ownId?: string
  targetId?: string
}

type Rights = {
  hasOwn: boolean
  hasAny: boolean
}

/**
 * Evaluates a role's user permissions for a single action + entity and returns
 * named rights. Permissions are expected to be pre-filtered by the database query.
 *
 * - `hasAny` is granted when a matching row has `access: 'any'`.
 * - `hasOwn` is granted when a matching row has `access: 'own'` and the current
 *   user is the target (`ownId === targetId`).
 */
export const getUserRights = (
  permissions: Permissions,
  options: Options,
): Rights => {
  const { action, entity, ownId, targetId } = options

  const matches = permissions.filter(
    (permission) =>
      permission.entity === entity && permission.action === action,
  )

  const hasAny = matches.some((permission) => permission.access === 'any')
  const hasOwn = matches.some(
    (permission) => permission.access === 'own' && ownId === targetId,
  )

  return { hasAny, hasOwn }
}
