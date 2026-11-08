import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { loadPodcastFeed } from './load-podcast-feed.server'

const { findFirstMock } = vi.hoisted(() => ({ findFirstMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { podcast: { findFirst: findFirstMock } },
}))

const EPISODE = {
  description: 'S paní učitelkou o kabinetu.',
  publishedAt: new Date('2026-11-02T08:30:00Z'),
  publishedNumber: 13,
  publishedSlug: 'za-dvermi',
  title: 'Za dveřmi',
}

const PODCAST = {
  description: 'Rozhovory s učiteli.',
  episodes: [EPISODE],
  publishedSlug: 'kabinet',
  title: 'Kabinet',
}

const FEED_PATH = '/feeds/podcasts/podcast-1.xml'

describe('loadPodcastFeed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')
    findFirstMock.mockReset()
  })

  test('finds the podcast by its id, published only, with its published episodes', async () => {
    findFirstMock.mockResolvedValue(PODCAST)

    await loadPodcastFeed('podcast-1', FEED_PATH)

    const query = findFirstMock.mock.lastCall?.[0]
    expect(query.where).toEqual({ id: 'podcast-1', state: 'published' })
    expect(query.select.episodes).toMatchObject({
      orderBy: { publishedAt: 'desc' },
      take: 20,
      where: { state: 'published' },
    })
  })

  test('is null for a podcast that is unknown or not published', async () => {
    findFirstMock.mockResolvedValue(null)

    expect(await loadPodcastFeed('podcast-1', FEED_PATH)).toBeNull()
  })

  test('names the channel after the podcast, in its own words', async () => {
    findFirstMock.mockResolvedValue(PODCAST)

    const feed = await loadPodcastFeed('podcast-1', FEED_PATH)

    expect(feed?.channel).toEqual({
      description: 'Rozhovory s učiteli.',
      feedUrl: 'https://vednemesicnik.cz/feeds/podcasts/podcast-1.xml',
      link: 'https://vednemesicnik.cz/podcasts/kabinet',
      title: 'Vedneměsíčník: Podcast Kabinet',
    })
  })

  test('falls back to the card sentence without a description', async () => {
    findFirstMock.mockResolvedValue({ ...PODCAST, description: '' })

    const feed = await loadPodcastFeed('podcast-1', FEED_PATH)

    expect(feed?.channel.description).toBe('Nové epizody ve čtečce novinek.')
  })

  test('links an episode to its page, numbered as the podcast page lists it', async () => {
    findFirstMock.mockResolvedValue(PODCAST)

    const feed = await loadPodcastFeed('podcast-1', FEED_PATH)

    expect(feed?.items).toEqual([
      {
        description: 'S paní učitelkou o kabinetu.',
        link: 'https://vednemesicnik.cz/podcasts/kabinet/za-dvermi',
        publishedAt: EPISODE.publishedAt,
        title: '#13 Za dveřmi',
      },
    ])
  })

  test('leaves out an episode without a published address', async () => {
    findFirstMock.mockResolvedValue({
      ...PODCAST,
      episodes: [{ ...EPISODE, publishedSlug: null }],
    })

    const feed = await loadPodcastFeed('podcast-1', FEED_PATH)

    expect(feed?.items).toEqual([])
  })
})
