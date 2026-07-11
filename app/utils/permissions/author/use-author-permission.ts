import type {
  AuthorPermissionAccess,
  AuthorPermissionAction,
  AuthorPermissionEntity,
  AuthorRoleName,
  ContentState,
} from '@generated/prisma/enums'
import { getAuthorRights } from '~/utils/permissions/core/get-author-rights'

type AuthorPermission = {
  entity: AuthorPermissionEntity
  action: AuthorPermissionAction
  access: AuthorPermissionAccess
  state: ContentState
}

type UseAuthorPermissionOptions = {
  authorId: string
  roleName: AuthorRoleName
  roleLevel: number
  permissions: AuthorPermission[]
}

export function useAuthorPermission(options: UseAuthorPermissionOptions) {
  const { authorId, permissions } = options

  return {
    can: (config: {
      entity: AuthorPermissionEntity
      action: AuthorPermissionAction
      state?: ContentState
      targetAuthorIds?: string[]
    }): { hasOwn: boolean; hasAny: boolean; hasPermission: boolean } => {
      const targetAuthorIds = config.targetAuthorIds ?? [authorId]

      const { hasOwn, hasAny } = getAuthorRights(permissions, {
        action: config.action,
        entity: config.entity,
        ownId: authorId,
        state: config.state,
        targetAuthorIds,
      })

      return {
        hasAny,
        hasOwn,
        hasPermission: hasOwn || hasAny,
      }
    },
  }
}
