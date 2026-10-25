import { beforeEach, describe, expect, test, vi } from 'vitest'

import { userRoles } from '~~/data/user-roles'

import { getUserPermissionContext } from './get-user-permission-context.server'

const { findUniqueOrThrowMock } = vi.hoisted(() => ({
  findUniqueOrThrowMock: vi.fn(),
}))

vi.mock('~/utils/auth.server', () => ({
  requireSession: vi.fn(async () => ({ sessionId: 'session-1' })),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { session: { findUniqueOrThrow: findUniqueOrThrowMock } },
}))

const OWNER_LEVEL = 1
const ADMINISTRATOR_LEVEL = 2
const MEMBER_LEVEL = 3

let roleName: 'member' | 'administrator' = 'administrator'

// The session user signed in with the seeded role's permission rows.
beforeEach(() => {
  findUniqueOrThrowMock.mockImplementation(async () => {
    const role = userRoles.find((userRole) => userRole.name === roleName)
    if (role === undefined) throw new Error(`Missing role ${roleName}`)

    return {
      user: {
        authorId: 'author-1',
        id: 'user-1',
        role: {
          level: role.level,
          name: role.name,
          permissions: role.permissions.flatMap(({ access, actions, entity }) =>
            actions.map((action) => ({ access, action, entity })),
          ),
        },
      },
    }
  })
})

const canOnUser = async (
  signedInAs: typeof roleName,
  action: 'view' | 'update' | 'delete',
  targetUserRoleLevel: number,
) => {
  roleName = signedInAs
  const context = await getUserPermissionContext(
    new Request('https://x/administration'),
    { actions: ['view', 'update', 'delete'], entities: ['user'] },
  )

  return context.can({
    action,
    entity: 'user',
    targetUserId: 'user-2',
    targetUserRoleLevel,
  }).hasPermission
}

describe('getUserPermissionContext role hierarchy', () => {
  test('an Administrator views the Owner account', async () => {
    expect(await canOnUser('administrator', 'view', OWNER_LEVEL)).toBe(true)
  })

  test.each(['update', 'delete'] as const)(
    'an Administrator cannot %s the Owner account',
    async (action) => {
      expect(await canOnUser('administrator', action, OWNER_LEVEL)).toBe(false)
    },
  )

  test('an Administrator updates a Member account', async () => {
    expect(await canOnUser('administrator', 'update', MEMBER_LEVEL)).toBe(true)
  })

  test.each([OWNER_LEVEL, ADMINISTRATOR_LEVEL])(
    'a Member does not view another account of level %i',
    async (level) => {
      expect(await canOnUser('member', 'view', level)).toBe(false)
    },
  )
})
