import { describe, expect, test } from 'vitest'

import { getUserRights } from '~/utils/permissions/core/get-user-rights'
import { userRoles } from '~~/data/user-roles'

import { canEditUser } from './can-edit-user'

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
        config.targetUserRoleLevel !== undefined &&
        config.targetUserRoleLevel < role.level

      return {
        hasAny,
        hasOwn,
        hasPermission: (hasAny || hasOwn) && !isAboveLevel,
      }
    },
  }
}

describe('canEditUser', () => {
  test('a member cannot edit their own account', () => {
    expect(
      canEditUser(makeContext('member'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(false)
  })

  test('a member cannot edit another account', () => {
    expect(
      canEditUser(makeContext('member'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(false)
  })

  test('an administrator edits another account and their own', () => {
    const administrator = makeContext('administrator')

    expect(
      canEditUser(administrator, {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(true)
    expect(
      canEditUser(administrator, {
        targetUserId: ownUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(true)
  })

  test('an administrator cannot edit the owner', () => {
    expect(
      canEditUser(makeContext('administrator'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(false)
  })

  test('the owner edits their own account', () => {
    expect(
      canEditUser(makeContext('owner'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(true)
  })
})
