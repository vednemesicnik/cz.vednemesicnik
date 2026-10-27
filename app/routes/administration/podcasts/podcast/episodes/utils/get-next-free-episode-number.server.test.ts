import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getNextFreeEpisodeNumber } from './get-next-free-episode-number.server'

const mocks = vi.hoisted(() => ({ aggregate: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcastEpisode: { aggregate: mocks.aggregate } },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getNextFreeEpisodeNumber', () => {
  test('is the highest number plus one, of non-empty episodes only', async () => {
    mocks.aggregate.mockResolvedValue({
      _max: { number: 13, publishedNumber: 12 },
    })

    expect(await getNextFreeEpisodeNumber({ podcastId: 'podcast-1' })).toBe(14)
    expect(mocks.aggregate).toHaveBeenCalledWith({
      _max: { number: true, publishedNumber: true },
      where: { firstContentAt: { not: null }, podcastId: 'podcast-1' },
    })
  })

  test('steps over a number an episode still holds since its last publish', async () => {
    mocks.aggregate.mockResolvedValue({
      _max: { number: 9, publishedNumber: 12 },
    })

    expect(await getNextFreeEpisodeNumber({ podcastId: 'podcast-1' })).toBe(13)
  })

  test('starts at 1 and leaves the episode itself out', async () => {
    mocks.aggregate.mockResolvedValue({
      _max: { number: null, publishedNumber: null },
    })

    expect(
      await getNextFreeEpisodeNumber({
        episodeId: 'episode-1',
        podcastId: 'podcast-1',
      }),
    ).toBe(1)
    expect(mocks.aggregate.mock.lastCall?.[0].where).toMatchObject({
      id: { not: 'episode-1' },
    })
  })
})
