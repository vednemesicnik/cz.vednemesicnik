import { beforeEach, describe, expect, test, vi } from 'vitest'

import { loadMissingPodcastContent } from './load-missing-podcast-content.server'

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findUniqueOrThrow: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    podcast: {
      findFirst: mocks.findFirst,
      findUniqueOrThrow: mocks.findUniqueOrThrow,
    },
  },
}))

const PODCAST = {
  cover: { id: 'c1' },
  description: 'O škole a lidech v ní.',
  slug: 'prestavka',
  title: 'Přestávka',
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findUniqueOrThrow.mockResolvedValue(PODCAST)
  mocks.findFirst.mockResolvedValue(null)
})

describe('loadMissingPodcastContent', () => {
  test('says nothing for a complete podcast with a free address', async () => {
    expect(await loadMissingPodcastContent('p1')).toEqual([])
  })

  test('checks the address against the other podcasts as published (log 0039)', async () => {
    await loadMissingPodcastContent('p1')

    expect(mocks.findFirst).toHaveBeenCalledWith({
      select: { id: true },
      where: { id: { not: 'p1' }, publishedSlug: 'prestavka' },
    })
  })

  test('names a taken address after what is missing (27i)', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...PODCAST, cover: null })
    mocks.findFirst.mockResolvedValue({ id: 'p2' })

    expect(await loadMissingPodcastContent('p1')).toEqual([
      'Chybí obálka.',
      'Adresa je obsazená.',
    ])
  })

  test('does not look up an empty address', async () => {
    mocks.findUniqueOrThrow.mockResolvedValue({ ...PODCAST, slug: '' })

    expect(await loadMissingPodcastContent('p1')).toEqual(['Chybí adresa.'])
    expect(mocks.findFirst).not.toHaveBeenCalled()
  })
})
