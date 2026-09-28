import { describe, expect, test } from 'vitest'

import { getUserRights } from '~/utils/permissions/core/get-user-rights'

import type { UserPermissionContext } from '../../user/context/get-user-permission-context.server'
import { canChangeAuthorRole } from './can-change-author-role.server'

const userId = 'user-1'

// Context stub whose `can()` evaluates the given catalog rows like the real one.
const makeContext = (access: 'own' | 'any') =>
  ({
    can: ({ action, entity, targetUserId }) => {
      const { hasAny, hasOwn } = getUserRights(
        [{ access, action: 'update', entity: 'author' }],
        { action, entity, ownId: userId, targetId: targetUserId },
      )
      return { hasAny, hasOwn, hasPermission: hasAny || hasOwn }
    },
  }) as UserPermissionContext

describe('canChangeAuthorRole', () => {
  test('denies a user who may only update their own author profile', () => {
    expect(canChangeAuthorRole(makeContext('own'))).toBe(false)
  })

  test('allows a user who may update any author', () => {
    expect(canChangeAuthorRole(makeContext('any'))).toBe(true)
  })
})
