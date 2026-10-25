import { describe, expect, test } from 'vitest'

import { getUserRights } from '~/utils/permissions/core/get-user-rights'
import { userRoles } from '~~/data/user-roles'

import { canDeleteUser } from './can-delete-user'

const ownUserId = 'user-1'
const otherUserId = 'user-2'

// Context stub that evaluates `can()` the way the real context does: against the
// seeded role's permission rows, then the role hierarchy.
const makeContext = (roleName: 'member' | 'administrator' | 'owner') => {
  const role = userRoles.find((userRole) => userRole.name === roleName)
  if (role === undefined) throw new Error(`Missing role ${roleName}`)

  const permissions = role.permissions.flatMap(({ access, actions, entity }) =>
    actions.map((action) => ({ access, action, entity })),
  )

  return {
    can: (config: {
      action: string
      entity: string
      targetUserId?: string
      targetUserRoleLevel?: number
    }) => {
      const { hasAny, hasOwn } = getUserRights(permissions, {
        action: config.action,
        entity: config.entity,
        ownId: ownUserId,
        targetId: config.targetUserId,
      })
      const isAboveLevel =
        config.action !== 'view' &&
        config.targetUserRoleLevel !== undefined &&
        config.targetUserRoleLevel < role.level

      return {
        hasAny,
        hasOwn,
        hasPermission: (hasAny || hasOwn) && !isAboveLevel,
      }
    },
    userId: ownUserId,
  }
}

describe('canDeleteUser', () => {
  test('an administrator deletes another member or administrator', () => {
    const administrator = makeContext('administrator')

    expect(
      canDeleteUser(administrator, {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(true)
    expect(
      canDeleteUser(administrator, {
        targetUserId: otherUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(true)
  })

  test('nobody is offered deleting their own account (28g)', () => {
    expect(
      canDeleteUser(makeContext('administrator'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(false)
    expect(
      canDeleteUser(makeContext('owner'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(false)
  })

  test("nobody is offered deleting the owner's account (28g)", () => {
    expect(
      canDeleteUser(makeContext('administrator'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(false)
  })

  test('a member deletes no account', () => {
    expect(
      canDeleteUser(makeContext('member'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(false)
  })
})
