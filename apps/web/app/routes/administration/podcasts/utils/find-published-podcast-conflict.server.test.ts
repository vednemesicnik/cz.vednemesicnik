import { beforeEach, describe, expect, test, vi } from 'vitest'

import { findPublishedPodcastConflict } from './find-published-podcast-conflict.server'

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcast: { findMany: mocks.findMany } },
}))

const options = { podcastId: 'podcast-1', slug: 'prestavka' }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findMany.mockResolvedValue([])
})

describe('findPublishedPodcastConflict', () => {
  test('finds nothing for a free address', async () => {
    expect(await findPublishedPodcastConflict(options)).toEqual({
      slugSuggestion: null,
      takenSlug: null,
    })
    expect(mocks.findMany).toHaveBeenCalledWith({
      select: { publishedSlug: true },
      where: {
        id: { not: 'podcast-1' },
        publishedSlug: { startsWith: 'prestavka' },
      },
    })
  })

  test('says the address is taken and offers the first free one (24d)', async () => {
    mocks.findMany.mockResolvedValue([
      { publishedSlug: 'prestavka' },
      { publishedSlug: 'prestavka-2' },
    ])

    expect(await findPublishedPodcastConflict(options)).toEqual({
      slugSuggestion: 'prestavka-3',
      takenSlug: 'prestavka',
    })
  })

  test('an address only starting the same is free', async () => {
    mocks.findMany.mockResolvedValue([{ publishedSlug: 'prestavka-podcast' }])

    expect(await findPublishedPodcastConflict(options)).toEqual({
      slugSuggestion: null,
      takenSlug: null,
    })
  })

  test('does not look up an empty address', async () => {
    expect(
      await findPublishedPodcastConflict({ ...options, slug: '' }),
    ).toEqual({ slugSuggestion: null, takenSlug: null })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })
})
