import { beforeEach, describe, expect, test, vi } from 'vitest'

const { auditLogFindFirst, userFindUnique } = vi.hoisted(() => ({
  auditLogFindFirst: vi.fn(),
  userFindUnique: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    auditLog: { findFirst: auditLogFindFirst },
    user: { findUnique: userFindUnique },
  },
}))

import { getLatestRoleChange } from './get-latest-role-change.server'

describe('getLatestRoleChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("names the newest change's actor and its moment in Prague", async () => {
    auditLogFindFirst.mockResolvedValue({
      actorId: 'admin',
      createdAt: new Date('2026-09-25T12:05:00.000Z'),
      detail: 'role: creator → coordinator',
    })
    userFindUnique.mockResolvedValue({ author: { name: 'Petr Dvořák' } })

    const change = await getLatestRoleChange({
      event: 'author_role_changed',
      roleName: 'coordinator',
      targetId: 'author',
    })

    expect(auditLogFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        where: { event: 'author_role_changed', targetId: 'author' },
      }),
    )
    expect(change).toEqual({
      actorName: 'Petr Dvořák',
      changedAt: '25. 9. 2026, 14:05',
    })
  })

  test('is null without a row', async () => {
    auditLogFindFirst.mockResolvedValue(null)

    await expect(
      getLatestRoleChange({
        event: 'author_role_changed',
        roleName: 'coordinator',
        targetId: 'author',
      }),
    ).resolves.toBeNull()
    expect(userFindUnique).not.toHaveBeenCalled()
  })

  test('is null when the newest row did not end on the stored role', async () => {
    auditLogFindFirst.mockResolvedValue({
      actorId: 'admin',
      createdAt: new Date('2026-09-25T12:05:00.000Z'),
      detail: 'role: coordinator → creator',
    })

    await expect(
      getLatestRoleChange({
        event: 'author_role_changed',
        roleName: 'contributor',
        targetId: 'author',
      }),
    ).resolves.toBeNull()
    expect(userFindUnique).not.toHaveBeenCalled()
  })

  test('is null when the actor is gone', async () => {
    auditLogFindFirst.mockResolvedValue({
      actorId: 'deleted',
      createdAt: new Date('2026-09-25T12:05:00.000Z'),
      detail: 'role: creator → coordinator',
    })
    userFindUnique.mockResolvedValue(null)

    await expect(
      getLatestRoleChange({
        event: 'author_role_changed',
        roleName: 'coordinator',
        targetId: 'author',
      }),
    ).resolves.toBeNull()
  })
})
