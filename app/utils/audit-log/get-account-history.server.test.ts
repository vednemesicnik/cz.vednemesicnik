import { beforeEach, describe, expect, test, vi } from 'vitest'

const { auditLogFindMany, userFindMany } = vi.hoisted(() => ({
  auditLogFindMany: vi.fn(),
  userFindMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    auditLog: { findMany: auditLogFindMany },
    user: { findMany: userFindMany },
  },
}))

import { getAccountHistory } from './get-account-history.server'

describe('getAccountHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('reads author role changes through the author id', async () => {
    auditLogFindMany.mockResolvedValue([])
    userFindMany.mockResolvedValue([])

    await getAccountHistory({ authorId: 'author', userId: 'user' })

    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            {
              event: { in: ['user_created', 'user_role_changed'] },
              targetId: 'user',
            },
            { event: 'author_role_changed', targetId: 'author' },
          ],
        },
      }),
    )
  })

  test("names each actor, and none for a deleted one's", async () => {
    auditLogFindMany.mockResolvedValue([
      {
        actorId: 'deleted-admin',
        createdAt: new Date('2026-10-08T07:41:00.000Z'),
        detail: 'role: member → administrator',
        event: 'user_role_changed',
        id: 'role-change',
      },
      {
        actorId: 'admin',
        createdAt: new Date('2025-10-14T13:20:00.000Z'),
        detail: null,
        event: 'user_created',
        id: 'creation',
      },
    ])
    userFindMany.mockResolvedValue([
      { author: { name: 'Petr Dvořák' }, id: 'admin' },
    ])

    const history = await getAccountHistory({
      authorId: 'author',
      userId: 'user',
    })

    expect(userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['deleted-admin', 'admin'] } },
      }),
    )
    expect(
      history.map(({ actorName, id, label }) => ({ actorName, id, label })),
    ).toEqual([
      {
        actorName: null,
        id: 'role-change',
        label: 'Uživatelská role: Administrátor, dříve Člen',
      },
      { actorName: 'Petr Dvořák', id: 'creation', label: 'Účet založen' },
    ])
  })
})
