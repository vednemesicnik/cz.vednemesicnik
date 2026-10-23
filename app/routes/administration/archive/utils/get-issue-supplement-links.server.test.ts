import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getIssueSupplementLinks } from './get-issue-supplement-links.server'

const { findFirstMock, findManyMock } = vi.hoisted(() => ({
  findFirstMock: vi.fn(),
  findManyMock: vi.fn(),
}))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { findFirst: findFirstMock, findMany: findManyMock } },
}))

const VISIBLE_WHERE = { state: 'published' as const }

const mainIssue = { order: 2, supplement: null, year: 2026 }
const supplement = { ...mainIssue, supplement: 'Maturitní ples' }

describe('getIssueSupplementLinks', () => {
  beforeEach(() => {
    findFirstMock.mockReset()
    findManyMock.mockReset()
  })

  test('a main issue links to the supplements the viewer may see', async () => {
    findManyMock.mockResolvedValue([
      { id: 'supplement-1', supplement: 'Maturitní ples' },
    ])

    const links = await getIssueSupplementLinks(mainIssue, VISIBLE_WHERE)

    expect(findManyMock.mock.lastCall?.[0].where).toEqual({
      AND: [
        VISIBLE_WHERE,
        { order: 2, supplementSlug: { not: '' }, year: 2026 },
      ],
    })
    expect(links).toEqual({
      kind: 'supplements',
      supplements: [{ id: 'supplement-1', label: 'Maturitní ples' }],
    })
  })

  test('a supplement links to its main issue by title', async () => {
    findFirstMock.mockResolvedValue({
      id: 'main-1',
      name: 'červen',
      order: 2,
      year: 2026,
    })

    const links = await getIssueSupplementLinks(supplement, VISIBLE_WHERE)

    expect(findFirstMock.mock.lastCall?.[0]).toMatchObject({
      // Of drafts sharing the number, the one holding it (log 0039).
      orderBy: { publishedNumber: 'desc' },
      where: {
        AND: [VISIBLE_WHERE, { order: 2, supplementSlug: '', year: 2026 }],
      },
    })
    expect(links).toEqual({
      kind: 'main-issue',
      mainIssue: { id: 'main-1', title: 'červen 2026' },
      orderLabel: '2/2026',
    })
  })

  test('a supplement without a main issue the viewer may see names only the order (26b)', async () => {
    findFirstMock.mockResolvedValue(null)

    expect(await getIssueSupplementLinks(supplement, VISIBLE_WHERE)).toEqual({
      kind: 'main-issue',
      mainIssue: null,
      orderLabel: '2/2026',
    })
  })
})
