import { describe, expect, test } from 'vitest'

import type { EpisodeRowRecord } from './episode-row-select'
import { getEpisodeRow } from './get-episode-row.server'

// Every right is held on own content, and the Coordinator holds it on any.
const createContext = (authorId: string, roleLevel: number) => ({
  authorId,
  can: ({ targetAuthorIds = [authorId] }: { targetAuthorIds?: string[] }) => {
    const hasOwn = targetAuthorIds.includes(authorId)
    const hasAny = roleLevel === 1

    return { hasAny, hasOwn, hasPermission: hasOwn || hasAny }
  },
  roleLevel,
})

const now = new Date('2026-10-29T12:00:00Z')

const episode = (overrides: Partial<EpisodeRowRecord>): EpisodeRowRecord => ({
  author: { id: 'contributor', name: 'Anna', role: { level: 3 } },
  description: '',
  heldByAuthor: null,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id: 'episode',
  links: [],
  number: 12,
  publishedAt: null,
  reviews: [],
  slug: 'kdo-pise-otazky',
  state: 'draft',
  submittedAt: new Date('2026-09-25T10:00:00Z'),
  title: 'Kdo píše maturitní otázky',
  updatedAt: new Date('2026-09-25T10:00:00Z'),
  ...overrides,
})

const coordinator = createContext('coordinator', 1)

describe('getEpisodeRow', () => {
  test('the Coordinator approves a waiting episode of a published podcast', () => {
    const row = getEpisodeRow(episode({}), {
      context: coordinator,
      isNumberTaken: false,
      isPodcastPublished: true,
      isSlugTaken: false,
      now,
    })

    expect(row).toMatchObject({
      authorName: 'Anna',
      isSelectable: true,
      row: 'approve',
      submission: 'pending',
    })
  })

  test('on an unpublished podcast it is still selectable, to hear why it cannot be published', () => {
    const row = getEpisodeRow(episode({}), {
      context: coordinator,
      isNumberTaken: false,
      isPodcastPublished: false,
      isSlugTaken: false,
      now,
    })

    expect(row.bulkActions).not.toContain('publish')
    expect(row.isSelectable).toBe(true)
  })

  test('a complete episode whose number or address another holds is incomplete', () => {
    const complete = episode({
      description: 'O maturitních otázkách.',
      links: [{ label: 'Spotify', url: 'https://example.local/12' }],
    })
    const options = {
      context: coordinator,
      isPodcastPublished: true,
      now,
    }

    expect(
      getEpisodeRow(complete, {
        ...options,
        isNumberTaken: false,
        isSlugTaken: false,
      }).isIncomplete,
    ).toBe(false)
    expect(
      getEpisodeRow(complete, {
        ...options,
        isNumberTaken: true,
        isSlugTaken: false,
      }).isIncomplete,
    ).toBe(true)
    expect(
      getEpisodeRow(complete, {
        ...options,
        isNumberTaken: false,
        isSlugTaken: true,
      }).isIncomplete,
    ).toBe(true)
  })

  test('while someone else edits it, the Coordinator takes it over and changes no state', () => {
    const row = getEpisodeRow(
      episode({
        heldByAuthor: { name: 'Jakub' },
        heldByAuthorId: 'contributor',
        heldByTabId: 'tab',
        heldSince: new Date('2026-10-29T11:55:00Z'),
        heldUntil: new Date('2026-10-29T12:05:00Z'),
      }),
      {
        context: coordinator,
        isNumberTaken: false,
        isPodcastPublished: true,
        isSlugTaken: false,
        now,
      },
    )

    expect(row).toMatchObject({
      heldUntil: '2026-10-29T12:05:00.000Z',
      holdLine: 'upravuje Jakub',
      isHeldByOther: true,
      isSelectable: true,
      menu: ['edit'],
      row: null,
    })
    expect(row.bulkActions).toContain('publish')
  })

  test('one’s own hold in another tab changes nothing but the line', () => {
    const row = getEpisodeRow(
      episode({
        heldByAuthor: { name: 'Jakub' },
        heldByAuthorId: 'coordinator',
        heldByTabId: 'tab',
        heldSince: new Date('2026-10-29T11:55:00Z'),
        heldUntil: new Date('2026-10-29T12:05:00Z'),
      }),
      {
        context: coordinator,
        isNumberTaken: false,
        isPodcastPublished: true,
        isSlugTaken: false,
        now,
      },
    )

    expect(row).toMatchObject({
      holdLine: 'upravujete vy',
      isHeldByOther: false,
      row: 'approve',
    })
  })
})
