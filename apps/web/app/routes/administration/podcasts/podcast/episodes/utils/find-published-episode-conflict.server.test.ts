import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findPublishedEpisodeConflict } from './find-published-episode-conflict.server'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  getNextFreeEpisodeNumber: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisode: { findFirst: mocks.findFirst, findMany: mocks.findMany },
  },
}))

vi.mock('./get-next-free-episode-number.server', () => ({
  getNextFreeEpisodeNumber: mocks.getNextFreeEpisodeNumber,
}))

const options = {
  episodeId: 'episode-1',
  number: 14,
  podcastId: 'podcast-1',
  slug: 'uvod',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findFirst.mockResolvedValue(null)
  mocks.findMany.mockResolvedValue([])
  mocks.getNextFreeEpisodeNumber.mockResolvedValue(15)
})

describe('findPublishedEpisodeConflict', () => {
  test('finds nothing for free values', async () => {
    expect(await findPublishedEpisodeConflict(options)).toEqual({
      freeNumber: null,
      slugSuggestion: null,
      takenNumber: null,
      takenSlug: null,
    })
  })

  test('compares only with what other episodes of the podcast hold as published', async () => {
    await findPublishedEpisodeConflict(options)

    expect(mocks.findFirst.mock.lastCall?.[0].where).toEqual({
      id: { not: 'episode-1' },
      podcastId: 'podcast-1',
      publishedNumber: 14,
    })
    expect(mocks.findMany.mock.lastCall?.[0].where).toEqual({
      id: { not: 'episode-1' },
      podcastId: 'podcast-1',
      publishedSlug: { startsWith: 'uvod' },
    })
  })

  test('offers the next free number and a numbered address for taken ones', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'episode-2' })
    mocks.findMany.mockResolvedValue([
      { publishedSlug: 'uvod' },
      { publishedSlug: 'uvod-2' },
      { publishedSlug: 'uvodni-slovo' },
    ])

    expect(await findPublishedEpisodeConflict(options)).toEqual({
      freeNumber: 15,
      slugSuggestion: 'uvod-3',
      takenNumber: 14,
      takenSlug: 'uvod',
    })
  })

  test('reads nothing for an empty number or address', async () => {
    await findPublishedEpisodeConflict({ ...options, number: null, slug: '' })

    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
