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

import { getAuthorHistory } from './get-author-history.server'

describe('getAuthorHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("reads the author's creation and role changes by its id", async () => {
    auditLogFindMany.mockResolvedValue([])
    userFindMany.mockResolvedValue([])

    await getAuthorHistory('author')

    expect(auditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        where: {
          event: { in: ['author_created', 'author_role_changed'] },
          targetId: 'author',
        },
      }),
    )
  })

  test('labels each entry with its actor, newest first', async () => {
    auditLogFindMany.mockResolvedValue([
      {
        actorId: 'admin',
        createdAt: new Date('2026-09-01T16:02:00.000Z'),
        detail: 'role: creator → coordinator',
        event: 'author_role_changed',
        id: 'role-change',
      },
      {
        actorId: 'owner',
        createdAt: new Date('2025-02-03T08:30:00.000Z'),
        detail: null,
        event: 'author_created',
        id: 'creation',
      },
    ])
    userFindMany.mockResolvedValue([
      { author: { name: 'Petr Dvořák' }, id: 'admin' },
      { author: { name: 'Vedneměsíčník, z. s.' }, id: 'owner' },
    ])

    const history = await getAuthorHistory('author')

    expect(
      history.map(({ actorName, id, label }) => ({ actorName, id, label })),
    ).toEqual([
      {
        actorName: 'Petr Dvořák',
        id: 'role-change',
        label: 'Autorská role: Koordinátor, dříve Tvůrce',
      },
      {
        actorName: 'Vedneměsíčník, z. s.',
        id: 'creation',
        label: 'Vytvořeno',
      },
    ])
  })
})
