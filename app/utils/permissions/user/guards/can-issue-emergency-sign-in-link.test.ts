import { describe, expect, test } from 'vitest'

import { getUserRights } from '~/utils/permissions/core/get-user-rights'
import { userRoles } from '~~/data/user-roles'

import { canIssueEmergencySignInLink } from './can-issue-emergency-sign-in-link'

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
    userId: ownUserId,
  }
}

describe('canIssueEmergencySignInLink', () => {
  test('an administrator issues one for a member or another administrator', () => {
    const administrator = makeContext('administrator')

    expect(
      canIssueEmergencySignInLink(administrator, {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(true)
    expect(
      canIssueEmergencySignInLink(administrator, {
        targetUserId: otherUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(true)
  })

  test('the owner issues one for an administrator', () => {
    expect(
      canIssueEmergencySignInLink(makeContext('owner'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(true)
  })

  test('nobody issues one for their own account', () => {
    expect(
      canIssueEmergencySignInLink(makeContext('administrator'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 2,
      }),
    ).toBe(false)
    expect(
      canIssueEmergencySignInLink(makeContext('owner'), {
        targetUserId: ownUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(false)
  })

  test("nobody issues one for the owner's account", () => {
    expect(
      canIssueEmergencySignInLink(makeContext('administrator'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 1,
      }),
    ).toBe(false)
  })

  test('a member issues none', () => {
    expect(
      canIssueEmergencySignInLink(makeContext('member'), {
        targetUserId: otherUserId,
        targetUserRoleLevel: 3,
      }),
    ).toBe(false)
  })
})
