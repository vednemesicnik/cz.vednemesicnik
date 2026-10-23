import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  checkCSRF: vi.fn(),
  flashAdminNotice: vi.fn(),
  getLatestRoleChange: vi.fn(),
  isEmailTaken: vi.fn(),
  recordAuditLog: vi.fn(),
  updateUser: vi.fn(),
  userFindUnique: vi.fn(),
  userRoleFindUniqueOrThrow: vi.fn(),
}))

vi.mock('~/utils/csrf.server', () => ({ checkCSRF: mocks.checkCSRF }))
vi.mock('~/utils/audit-log.server', () => ({
  formatRoleChangeDetail: (from: string, to: string) => `role: ${from} → ${to}`,
  recordAuditLog: mocks.recordAuditLog,
}))
vi.mock('~/utils/audit-log/get-latest-role-change.server', () => ({
  getLatestRoleChange: mocks.getLatestRoleChange,
}))
vi.mock('~/utils/admin-notice/flash-admin-notice.server', () => ({
  flashAdminNotice: mocks.flashAdminNotice,
}))
vi.mock('~/utils/db.server', () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    userRole: { findUniqueOrThrow: mocks.userRoleFindUniqueOrThrow },
  },
}))
vi.mock('../../utils/is-email-taken.server', () => ({
  isEmailTaken: mocks.isEmailTaken,
}))
vi.mock('./utils/update-user.server', () => ({ updateUser: mocks.updateUser }))
vi.mock(
  '~/utils/permissions/user/context/get-user-permission-context.server',
  () => ({
    getUserPermissionContext: async () => ({
      can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
      userId: 'admin',
    }),
  }),
)

import { action } from './_action'

const roles = {
  administrator: { id: 'administrator-id', level: 2, name: 'administrator' },
  member: { id: 'member-id', level: 3, name: 'member' },
  owner: { id: 'owner-id', level: 1, name: 'owner' },
} as const

const save = async ({
  userId,
  fields,
}: {
  userId: string
  fields: Record<string, string>
}) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)

  return action({
    params: { userId },
    request: new Request(
      `https://test.local/administration/users/${userId}/edit`,
      { body, method: 'POST' },
    ),
  } as unknown as Parameters<typeof action>[0])
}

const storeUser = (userId: string, role: keyof typeof roles) =>
  mocks.userFindUnique.mockResolvedValue({
    email: `${userId}@vednemesicnik.cz`,
    id: userId,
    role: roles[role],
  })

const catchResponse = async (run: () => Promise<unknown>) => {
  try {
    await run()
  } catch (response) {
    return response as Response
  }

  throw new Error('The action did not throw.')
}

describe('Upravit uživatele action (design 28f, 28g)', () => {
  beforeEach(() => {
    mocks.checkCSRF.mockResolvedValue(null)
    mocks.isEmailTaken.mockResolvedValue(false)
    mocks.flashAdminNotice.mockResolvedValue('notice=flashed')
    mocks.userRoleFindUniqueOrThrow.mockImplementation(
      async ({ where }: { where: { name: keyof typeof roles } }) =>
        roles[where.name],
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('removing one’s own administration writes Člen and lands on Přehled', async () => {
    storeUser('admin', 'administrator')
    mocks.updateUser.mockResolvedValue({
      previousRoleName: 'administrator',
      roleName: 'member',
      status: 'role-changed',
    })

    const response = await catchResponse(() =>
      save({
        fields: {
          email: 'admin@vednemesicnik.cz',
          loadedRoleId: 'administrator-id',
        },
        userId: 'admin',
      }),
    )

    expect(mocks.updateUser).toHaveBeenCalledWith({
      email: 'admin@vednemesicnik.cz',
      role: { ...roles.member, loadedRoleId: 'administrator-id' },
      userId: 'admin',
    })
    expect(mocks.recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'role: administrator → member',
        event: 'user_role_changed',
        targetId: 'admin',
      }),
    )
    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/administration')
    expect(mocks.flashAdminNotice).toHaveBeenCalledWith(
      expect.any(Request),
      'Uživatel uložen',
    )
  })

  test('removing another account’s administration stays on the form', async () => {
    storeUser('jakub', 'administrator')
    mocks.updateUser.mockResolvedValue({
      previousRoleName: 'administrator',
      roleName: 'member',
      status: 'role-changed',
    })

    const result = await save({
      fields: {
        email: 'jakub@vednemesicnik.cz',
        loadedRoleId: 'administrator-id',
      },
      userId: 'jakub',
    })

    expect(result).toEqual({ status: 'success' })
    expect(mocks.flashAdminNotice).not.toHaveBeenCalled()
  })

  test('a collision returns the current role and its change', async () => {
    storeUser('jakub', 'administrator')
    mocks.updateUser.mockResolvedValue({
      currentRoleId: 'administrator-id',
      currentRoleName: 'administrator',
      status: 'role-conflict',
    })
    mocks.getLatestRoleChange.mockResolvedValue({
      actorName: 'Petr Dvořák',
      changedAt: '25. 9. 2026, 14:05',
    })

    const result = await save({
      fields: { email: 'jakub@vednemesicnik.cz', loadedRoleId: 'member-id' },
      userId: 'jakub',
    })

    expect(result).toEqual({
      currentRoleId: 'administrator-id',
      isAdministrator: true,
      roleChange: { actorName: 'Petr Dvořák', changedAt: '25. 9. 2026, 14:05' },
      status: 'role-conflict',
    })
    expect(mocks.getLatestRoleChange).toHaveBeenCalledWith({
      event: 'user_role_changed',
      roleName: 'administrator',
      targetId: 'jakub',
    })
    expect(mocks.recordAuditLog).not.toHaveBeenCalled()
  })

  test("the Owner's role is never sent, and a sent one is refused", async () => {
    storeUser('owner', 'owner')

    const response = await catchResponse(() =>
      save({
        fields: {
          email: 'owner@vednemesicnik.cz',
          isAdministrator: 'on',
          loadedRoleId: 'owner-id',
        },
        userId: 'owner',
      }),
    )

    expect((response as unknown as { init: ResponseInit }).init.status).toBe(
      403,
    )
    expect(mocks.updateUser).not.toHaveBeenCalled()
  })

  test("the Owner's e-mail saves without a role", async () => {
    storeUser('owner', 'owner')
    mocks.updateUser.mockResolvedValue({ status: 'saved' })

    const result = await save({
      fields: { email: 'owner@vednemesicnik.cz' },
      userId: 'owner',
    })

    expect(result).toEqual({ status: 'success' })
    expect(mocks.updateUser).toHaveBeenCalledWith({
      email: 'owner@vednemesicnik.cz',
      role: null,
      userId: 'owner',
    })
  })
})
