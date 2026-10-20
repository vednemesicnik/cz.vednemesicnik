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

  test('looks up only named main issues the viewer may see', async () => {
    findManyMock.mockResolvedValue([{ name: 'červen', order: 2, year: 2026 }])

    const issues = await resolveIssueTitles([supplement], VISIBLE_WHERE)

    expect(findManyMock.mock.lastCall?.[0].where).toEqual({
      AND: [
        VISIBLE_WHERE,
        {
          name: { not: null },
          OR: [{ order: 2, year: 2026 }],
          supplementSlug: '',
        },
      ],
    })
    expect(issues[0].title).toBe('Maturitní ples · doplněk k číslu červen 2026')
  })

  test('names a supplement by the order when its main issue is not found', async () => {
    findManyMock.mockResolvedValue([])

    const issues = await resolveIssueTitles([supplement], VISIBLE_WHERE)

    expect(issues[0].title).toBe('Maturitní ples · doplněk k číslu 2/2026')
  })
})
