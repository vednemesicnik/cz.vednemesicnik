import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findPublishedNumberConflict } from './find-published-number-conflict.server'

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findTakenIssueIds: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { findMany: mocks.findMany } },
}))

vi.mock('./find-taken-issue-ids.server', () => ({
  findTakenIssueIds: mocks.findTakenIssueIds,
}))

const mainIssue = {
  issueId: 'i1',
  order: 3,
  supplementSlug: '',
  year: 2026,
}

// The year's other main issues, then the numbers held in the year.
const mockYear = (orders: number[], publishedNumbers: string[]) =>
  mocks.findMany
    .mockResolvedValueOnce(orders.map((order) => ({ order })))
    .mockResolvedValueOnce(
      publishedNumbers.map((publishedNumber) => ({ publishedNumber })),
    )

beforeEach(() => {
  mocks.findMany.mockReset()
  mocks.findTakenIssueIds.mockReset()
  mocks.findTakenIssueIds.mockResolvedValue(new Set(['i1']))
})

describe('findPublishedNumberConflict', () => {
  test('is null for a free number', async () => {
    mocks.findTakenIssueIds.mockResolvedValue(new Set())

    expect(await findPublishedNumberConflict(mainIssue)).toBeNull()
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  test('offers the order after the other main issues of the year (26d)', async () => {
    mockYear([1, 2, 3], ['2026-1', '2026-2', '2026-3'])

    expect(await findPublishedNumberConflict(mainIssue)).toEqual({
      freeOrder: 4,
      takenNumber: '2026-3',
    })
  })

  test('offers past a number an issue holds though now numbered otherwise', async () => {
    // Retracted after 4/2026 and renumbered, it still holds 2026-4.
    mockYear([1, 2, 3], ['2026-3', '2026-4', '2026-2-maturitni-ples'])

    expect(await findPublishedNumberConflict(mainIssue)).toMatchObject({
      freeOrder: 5,
    })
  })

  test('offers no order for a supplement', async () => {
    expect(
      await findPublishedNumberConflict({
        ...mainIssue,
        order: 2,
        supplementSlug: 'maturitni-ples',
      }),
    ).toEqual({ freeOrder: null, takenNumber: '2026-2-maturitni-ples' })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
