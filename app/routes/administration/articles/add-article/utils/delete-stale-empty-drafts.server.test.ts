import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  deleteStaleEmptyDrafts,
  STALE_EMPTY_DRAFT_AGE_MILLISECONDS,
} from './delete-stale-empty-drafts.server'

const mocks = vi.hoisted(() => ({
  deleteContentLog: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    article: { deleteMany: mocks.deleteMany, findMany: mocks.findMany },
  },
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: mocks.deleteContentLog,
}))

const now = new Date('2026-10-15T12:00:00Z')

const staleWhere = {
  createdAt: {
    lt: new Date(now.getTime() - STALE_EMPTY_DRAFT_AGE_MILLISECONDS),
  },
  firstContentAt: null,
  OR: [{ heldUntil: null }, { heldUntil: { lt: now } }],
}

beforeEach(() => {
  vi.clearAllMocks()
  // The first lookup finds the stale drafts, the second the ones still there.
  mocks.findMany
    .mockResolvedValueOnce([{ id: 'draft-1' }, { id: 'draft-2' }])
    .mockResolvedValueOnce([])
  mocks.deleteMany.mockResolvedValue({ count: 2 })
})

describe('deleteStaleEmptyDrafts', () => {
  test('looks for empty drafts older than a day whose hold is free', async () => {
    await deleteStaleEmptyDrafts(now)

    expect(mocks.findMany.mock.calls[0][0]).toEqual({
      select: { id: true },
      where: staleWhere,
    })
  })

  test('deletes them again only while they are still empty and free', async () => {
    const count = await deleteStaleEmptyDrafts(now)

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { ...staleWhere, id: { in: ['draft-1', 'draft-2'] } },
    })
    expect(count).toBe(2)
  })

  test('takes their history rows with them', async () => {
    await deleteStaleEmptyDrafts(now)

    expect(mocks.deleteContentLog.mock.calls).toEqual([
      [{ entity: 'article', entityId: 'draft-1' }],
      [{ entity: 'article', entityId: 'draft-2' }],
    ])
  })

  test('keeps the history of a draft that got content meanwhile', async () => {
    mocks.findMany.mockReset()
    mocks.findMany
      .mockResolvedValueOnce([{ id: 'draft-1' }, { id: 'draft-2' }])
      .mockResolvedValueOnce([{ id: 'draft-2' }])
    mocks.deleteMany.mockResolvedValue({ count: 1 })

    await deleteStaleEmptyDrafts(now)

    expect(mocks.deleteContentLog.mock.calls).toEqual([
      [{ entity: 'article', entityId: 'draft-1' }],
    ])
  })

  test('writes nothing when there is nothing to clear', async () => {
    mocks.findMany.mockReset()
    mocks.findMany.mockResolvedValue([])

    expect(await deleteStaleEmptyDrafts(now)).toBe(0)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
    expect(mocks.deleteContentLog).not.toHaveBeenCalled()
  })
})
