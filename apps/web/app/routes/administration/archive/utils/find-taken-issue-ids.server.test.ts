import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findTakenIssueIds } from './find-taken-issue-ids.server'

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { findMany: findManyMock } },
}))

beforeEach(() => {
  findManyMock.mockReset()
  findManyMock.mockResolvedValue([])
})

describe('findTakenIssueIds', () => {
  test('looks up the published numbers the issues have', async () => {
    await findTakenIssueIds([
      { id: 'i1', order: 4, supplementSlug: '', year: 2026 },
      { id: 'i2', order: 2, supplementSlug: 'maturitni-ples', year: 2026 },
    ])

    expect(findManyMock.mock.lastCall?.[0].where).toEqual({
      publishedNumber: { in: ['2026-4', '2026-2-maturitni-ples'] },
    })
  })

  test('names an issue whose number another issue holds (log 0039)', async () => {
    findManyMock.mockResolvedValue([
      { id: 'holder', publishedNumber: '2026-4' },
    ])

    const takenIds = await findTakenIssueIds([
      { id: 'i1', order: 4, supplementSlug: '', year: 2026 },
      { id: 'i2', order: 5, supplementSlug: '', year: 2026 },
    ])

    expect([...takenIds]).toEqual(['i1'])
  })

  test('the number an issue holds itself is not taken', async () => {
    findManyMock.mockResolvedValue([{ id: 'i1', publishedNumber: '2026-4' }])

    const takenIds = await findTakenIssueIds([
      { id: 'i1', order: 4, supplementSlug: '', year: 2026 },
    ])

    expect(takenIds.size).toBe(0)
  })

  test('an incomplete number is never taken, and nothing is read', async () => {
    const takenIds = await findTakenIssueIds([
      { id: 'i1', order: null, supplementSlug: '', year: 2026 },
      { id: 'i2', order: 4, supplementSlug: '', year: null },
    ])

    expect(takenIds.size).toBe(0)
    expect(findManyMock).not.toHaveBeenCalled()
  })
})
