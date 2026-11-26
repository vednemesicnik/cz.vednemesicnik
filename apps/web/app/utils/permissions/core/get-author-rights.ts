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
  action: Action
  entity: Entity
  state?: State
  ownId?: string
  targetAuthorIds?: string[]
}

type Rights = {
  hasOwn: boolean
  hasAny: boolean
}

/**
 * Evaluates a role's author permissions for a single action + entity and returns
 * named rights. Permissions are expected to be pre-filtered by the database query.
 *
 * - An omitted `state` matches any state.
 * - `hasAny` is granted when a matching row has `access: 'any'`.
 * - `hasOwn` is granted when a matching row has `access: 'own'` and the current
 *   author is one of the target authors (`targetAuthorIds.includes(ownId)`) —
 *   i.e. "own applies when I am one of the authors".
 */
export const getAuthorRights = (
  permissions: Permissions,
  options: Options,
): Rights => {
  const { action, entity, state, ownId, targetAuthorIds } = options

  const matches = permissions.filter(
    (permission) =>
      permission.entity === entity &&
      permission.action === action &&
      (state === undefined || permission.state === state),
  )

  const isOwn =
    ownId !== undefined && (targetAuthorIds?.includes(ownId) ?? false)

  const hasAny = matches.some((permission) => permission.access === 'any')
  const hasOwn = matches.some(
    (permission) => permission.access === 'own' && isOwn,
  )

  return { hasAny, hasOwn }
}
