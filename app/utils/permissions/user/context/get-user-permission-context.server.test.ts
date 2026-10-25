import { describe, expect, test, vi } from 'vitest'

import { getUserPermissionContext } from './get-user-permission-context.server'

const OWNER_LEVEL = 1
const ADMINISTRATOR_LEVEL = 2
const MEMBER_LEVEL = 3

vi.mock('~/utils/auth.server', () => ({
  requireSession: vi.fn(async () => ({ sessionId: 'session-1' })),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    session: {
      findUniqueOrThrow: vi.fn(async () => ({
        user: {
          authorId: 'author-1',
          id: 'administrator-1',
          role: {
            level: ADMINISTRATOR_LEVEL,
            name: 'administrator',
            permissions: (['view', 'update', 'delete'] as const).map(
              (action) => ({ access: 'any', action, entity: 'user' }),
            ),
          },
        },
      })),
    },
  },
}))

const getAdministratorContext = () =>
  getUserPermissionContext(new Request('https://x/administration'), {
    actions: ['view', 'update', 'delete'],
    entities: ['user'],
  })

describe('getUserPermissionContext role hierarchy', () => {
  test('an Administrator views the Owner account', async () => {
    const context = await getAdministratorContext()

    expect(
      context.can({
        action: 'view',
        entity: 'user',
        targetUserId: 'owner-1',
        targetUserRoleLevel: OWNER_LEVEL,
      }).hasPermission,
    ).toBe(true)
  })

  test.each(['update', 'delete'] as const)(
    'an Administrator cannot %s the Owner account',
    async (action) => {
      const context = await getAdministratorContext()

      expect(
        context.can({
          action,
          entity: 'user',
          targetUserId: 'owner-1',
          targetUserRoleLevel: OWNER_LEVEL,
        }).hasPermission,
      ).toBe(false)
    },
  )

  test('an Administrator updates a Member account', async () => {
    const context = await getAdministratorContext()

    expect(
      context.can({
        action: 'update',
        entity: 'user',
        targetUserId: 'member-1',
        targetUserRoleLevel: MEMBER_LEVEL,
      }).hasPermission,
    ).toBe(true)
  })
})
