import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  deleteStaleEmptyEpisodeDrafts,
  STALE_EMPTY_EPISODE_DRAFT_AGE_MILLISECONDS,
} from './delete-stale-empty-episode-drafts.server'

const mocks = vi.hoisted(() => ({
  deleteContentLog: vi.fn(),
  deleteMany: vi.fn(),
  findMany: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisode: { deleteMany: mocks.deleteMany, findMany: mocks.findMany },
  },
}))

vi.mock('~/utils/content-log/delete-content-log.server', () => ({
  deleteContentLog: mocks.deleteContentLog,
}))

const now = new Date('2026-10-15T12:00:00Z')

// Its hold expired, whatever its age (24e); or never held for a hold's length.
const staleWhere = {
  firstContentAt: null,
  OR: [
    { heldUntil: { lt: now } },
    {
      createdAt: {
        lt: new Date(
          now.getTime() - STALE_EMPTY_EPISODE_DRAFT_AGE_MILLISECONDS,
        ),
      },
      heldUntil: null,
    },
  ],
  state: 'draft',
}

beforeEach(() => {
  vi.clearAllMocks()
  // The first lookup finds the stale drafts, the second the ones still there.
  mocks.findMany
    .mockResolvedValueOnce([{ id: 'draft-1' }, { id: 'draft-2' }])
    .mockResolvedValueOnce([])
  mocks.deleteMany.mockResolvedValue({ count: 2 })
})

describe('deleteStaleEmptyEpisodeDrafts', () => {
  test('looks for empty drafts whose hold expired, or never held for a day', async () => {
    await deleteStaleEmptyEpisodeDrafts({ now })

    expect(mocks.findMany.mock.calls[0][0]).toEqual({
      select: { id: true },
      where: staleWhere,
    })
  })

  test('deletes them again only while they are still empty and free', async () => {
    const count = await deleteStaleEmptyEpisodeDrafts({ now })

    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: { ...staleWhere, id: { in: ['draft-1', 'draft-2'] } },
    })
    expect(count).toBe(2)
  })

  test('takes their history rows with them', async () => {
    await deleteStaleEmptyEpisodeDrafts({ now })

    expect(mocks.deleteContentLog.mock.calls).toEqual([
      [{ entity: 'podcast_episode', entityId: 'draft-1' }],
      [{ entity: 'podcast_episode', entityId: 'draft-2' }],
    ])
  })

  test('keeps the history of a draft that got content meanwhile', async () => {
    mocks.findMany.mockReset()
    mocks.findMany
      .mockResolvedValueOnce([{ id: 'draft-1' }, { id: 'draft-2' }])
      .mockResolvedValueOnce([{ id: 'draft-2' }])
    mocks.deleteMany.mockResolvedValue({ count: 1 })

    await deleteStaleEmptyEpisodeDrafts({ now })

    expect(mocks.deleteContentLog.mock.calls).toEqual([
      [{ entity: 'podcast_episode', entityId: 'draft-1' }],
    ])
  })

  test('writes nothing when there is nothing to clear', async () => {
    mocks.findMany.mockReset()
    mocks.findMany.mockResolvedValue([])

    expect(await deleteStaleEmptyEpisodeDrafts({ now })).toBe(0)
    expect(mocks.deleteMany).not.toHaveBeenCalled()
    expect(mocks.deleteContentLog).not.toHaveBeenCalled()
  })
})
