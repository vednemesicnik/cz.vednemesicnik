import { beforeEach, describe, expect, test, vi } from 'vitest'

import { resolveIssueTitles } from './resolve-issue-titles.server'

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }))

vi.mock('~/utils/db.server', () => ({
  prisma: { issue: { findMany: findManyMock } },
}))

const VISIBLE_WHERE = { state: 'published' as const }

const mainIssue = { name: null, order: 2, supplement: null, year: 2026 }
const supplement = { ...mainIssue, supplement: 'Maturitní ples' }

describe('resolveIssueTitles', () => {
  beforeEach(() => {
    findManyMock.mockReset()
  })

  test('runs no query without a supplement', async () => {
    const issues = await resolveIssueTitles(
      [{ ...mainIssue, name: 'červen' }],
      VISIBLE_WHERE,
    )

    expect(findManyMock).not.toHaveBeenCalled()
    expect(issues[0].title).toBe('červen 2026')
  })

  test('looks up only main issues the viewer may see, the holder first', async () => {
    findManyMock.mockResolvedValue([{ name: 'červen', order: 2, year: 2026 }])

    const issues = await resolveIssueTitles([supplement], VISIBLE_WHERE)

    expect(findManyMock.mock.lastCall?.[0]).toMatchObject({
      orderBy: { publishedNumber: 'desc' },
      where: {
        AND: [
          VISIBLE_WHERE,
          { OR: [{ order: 2, year: 2026 }], supplementSlug: '' },
        ],
      },
    })
    expect(issues[0].title).toBe('Maturitní ples · doplněk k číslu červen 2026')
  })

  test('takes the name of the issue that holds the number (log 0039)', async () => {
    // A draft sharing the number comes after the holder.
    findManyMock.mockResolvedValue([
      { name: null, order: 2, year: 2026 },
      { name: 'koncept', order: 2, year: 2026 },
    ])

    const issues = await resolveIssueTitles([supplement], VISIBLE_WHERE)

    expect(issues[0].title).toBe('Maturitní ples · doplněk k číslu 2/2026')
  })

  test('names a supplement by the order when its main issue is not found', async () => {
    findManyMock.mockResolvedValue([])

    const issues = await resolveIssueTitles([supplement], VISIBLE_WHERE)

    expect(issues[0].title).toBe('Maturitní ples · doplněk k číslu 2/2026')
  })
})
