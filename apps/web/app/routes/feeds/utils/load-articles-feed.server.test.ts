import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { loadArticlesFeed } from './load-articles-feed.server'

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { article: { findMany: findManyMock } },
}))

const ARTICLE = {
  authors: [{ name: 'Jana Nováková' }, { name: 'Petr Svoboda' }],
  perex: 'Krátký úvod.',
  publishedAt: new Date('2026-11-02T08:30:00Z'),
  publishedSlug: 'prvni-clanek',
  title: 'První článek',
}

describe('loadArticlesFeed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')
    findManyMock.mockReset()
  })

  test('asks only for published articles, the newest twenty', async () => {
    findManyMock.mockResolvedValue([])

    await loadArticlesFeed('/feeds/articles.xml')

    expect(findManyMock.mock.lastCall?.[0]).toMatchObject({
      orderBy: { publishedAt: 'desc' },
      take: 20,
      where: { state: 'published' },
    })
  })

  test('names the channel and its own address', async () => {
    findManyMock.mockResolvedValue([])

    const { channel } = await loadArticlesFeed('/feeds/articles.json')

    expect(channel).toEqual({
      description: 'Nové články z našeho webu.',
      feedUrl: 'https://vednemesicnik.cz/feeds/articles.json',
      link: 'https://vednemesicnik.cz/articles',
      title: 'Vedneměsíčník: Články',
    })
  })

  test('links an article at its published address, with its authors and perex', async () => {
    findManyMock.mockResolvedValue([ARTICLE])

    const { items } = await loadArticlesFeed('/feeds/articles.xml')

    expect(items).toEqual([
      {
        author: 'Jana Nováková, Petr Svoboda',
        description: 'Krátký úvod.',
        link: 'https://vednemesicnik.cz/articles/prvni-clanek',
        publishedAt: ARTICLE.publishedAt,
        title: 'První článek',
      },
    ])
  })

  test('leaves out an article without a published address', async () => {
    findManyMock.mockResolvedValue([{ ...ARTICLE, publishedSlug: null }])

    const { items } = await loadArticlesFeed('/feeds/articles.xml')

    expect(items).toEqual([])
  })

  test('has no author and no description when the article has none', async () => {
    findManyMock.mockResolvedValue([{ ...ARTICLE, authors: [], perex: null }])

    const [item] = (await loadArticlesFeed('/feeds/articles.xml')).items

    expect(item.author).toBeUndefined()
    expect(item.description).toBeUndefined()
  })
})
