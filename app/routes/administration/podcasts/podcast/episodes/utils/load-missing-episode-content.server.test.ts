import { beforeEach, describe, expect, test, vi } from 'vitest'

import { loadMissingEpisodeContent } from './load-missing-episode-content.server'

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

const EPISODE = {
  description: 'Pan Kovář se stará o budovu dvacet let.',
  links: [{ label: 'Spotify', url: 'https://open.spotify.com/episode/1' }],
  number: 13,
  podcastId: 'p1',
  slug: 'skolnik',
  title: 'Školník',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUniqueOrThrow.mockResolvedValue(EPISODE)
  mocks.findFirst.mockResolvedValue(null)
})

describe('loadMissingEpisodeContent', () => {
  test('says nothing for a complete episode with free values', async () => {
    expect(await loadMissingEpisodeContent('e1')).toEqual([])
  })

  test('checks the number and the address against the other episodes of the podcast as published', async () => {
    await loadMissingEpisodeContent('e1')

    expect(mocks.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: { not: 'e1' }, podcastId: 'p1', publishedNumber: 13 },
    })
    expect(mocks.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: { not: 'e1' }, podcastId: 'p1', publishedSlug: 'skolnik' },
    })
  })

  test('says a taken number and a taken address', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'e2' })

    expect(await loadMissingEpisodeContent('e1')).toEqual([
      'Číslo 13 je obsazené.',
      'Adresa je obsazená.',
    ])
  })

  test('looks up no holder for an empty number or address', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({
      ...EPISODE,
      number: null,
      slug: '',
    })

    expect(await loadMissingEpisodeContent('e1')).toEqual(['Chybí číslo.'])
    expect(mocks.findFirst).not.toHaveBeenCalled()
  })
})
