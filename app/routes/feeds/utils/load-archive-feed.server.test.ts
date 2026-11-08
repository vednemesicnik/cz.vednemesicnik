import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { loadArchiveFeed } from './load-archive-feed.server'

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { findMany: findManyMock } },
}))

const ISSUE = {
  name: 'podzim',
  order: 3,
  pdf: { fileName: '2026-3.pdf' },
  publishedAt: new Date('2026-11-02T08:30:00Z'),
  supplement: null,
  year: 2026,
}

describe('loadArchiveFeed', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')
    findManyMock.mockReset()
  })

  test('asks only for published issues, the most recently published twenty', async () => {
    findManyMock.mockResolvedValue([])

    await loadArchiveFeed('/feeds/archive.xml')

    expect(findManyMock.mock.calls[0][0]).toMatchObject({
      orderBy: { publishedAt: 'desc' },
      take: 20,
      where: { state: 'published' },
    })
  })

  test('names the channel and its own address', async () => {
    findManyMock.mockResolvedValue([])

    const { channel } = await loadArchiveFeed('/feeds/archive.xml')

    expect(channel).toEqual({
      description: 'Nová tištěná čísla časopisu.',
      feedUrl: 'https://vednemesicnik.cz/feeds/archive.xml',
      link: 'https://vednemesicnik.cz/archive',
      title: 'Vedneměsíčník: Archiv čísel',
    })
  })

  test('links an issue to its PDF under its title', async () => {
    findManyMock.mockResolvedValue([ISSUE])

    const { items } = await loadArchiveFeed('/feeds/archive.xml')

    expect(items).toEqual([
      {
        link: 'https://vednemesicnik.cz/archive/2026-3.pdf',
        publishedAt: ISSUE.publishedAt,
        title: 'podzim 2026',
      },
    ])
  })

  test('leaves out an issue without a PDF', async () => {
    findManyMock.mockResolvedValue([
      { ...ISSUE, pdf: null },
      { ...ISSUE, pdf: { fileName: null } },
    ])

    const { items } = await loadArchiveFeed('/feeds/archive.xml')

    expect(items).toEqual([])
  })
})
