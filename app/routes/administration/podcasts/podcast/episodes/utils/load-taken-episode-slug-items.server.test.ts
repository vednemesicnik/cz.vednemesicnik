import { beforeEach, describe, expect, test, vi } from 'vitest'

import { loadTakenEpisodeSlugItems } from './load-taken-episode-slug-items.server'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUniqueOrThrow: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcastEpisode: {
      findFirst: mocks.findFirst,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUniqueOrThrow.mockResolvedValue({ podcastId: 'p1', slug: 'uvod' })
})

describe('loadTakenEpisodeSlugItems', () => {
  test('says the address is taken when another episode of the podcast holds it', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'e2' })

    expect(await loadTakenEpisodeSlugItems('e1')).toEqual([
      'Adresa je obsazená.',
    ])
  })

  test('says nothing when the address is free', async () => {
    mocks.findFirst.mockResolvedValue(null)

    expect(await loadTakenEpisodeSlugItems('e1')).toEqual([])
  })

  test('looks only at the published addresses of the same podcast, not its own', async () => {
    mocks.findFirst.mockResolvedValue(null)

    await loadTakenEpisodeSlugItems('e1')

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { not: 'e1' }, podcastId: 'p1', publishedSlug: 'uvod' },
      }),
    )
  })
})
