import { describe, expect, test } from 'vitest'

import { getPodcastRow } from './get-podcast-row.server'
import type { PodcastRowRecord } from './podcast-row-select'

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

const podcast = (overrides: Partial<PodcastRowRecord>): PodcastRowRecord => ({
  _count: { episodes: 0 },
  author: { id: 'contributor', name: 'Anna', role: { level: 3 } },
  cover: null,
  description: '',
  heldByAuthor: null,
  heldByAuthorId: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  id: 'podcast',
  reviews: [],
  slug: 'kabinet',
  state: 'draft',
  submittedAt: null,
  submittedBy: null,
  title: 'Kabinet',
  updatedAt: new Date('2026-09-26T10:00:00Z'),
  ...overrides,
})

describe('getPodcastRow', () => {
  test('a waiting podcast puts the approval first in „⋯“', () => {
    const row = getPodcastRow(
      podcast({ submittedAt: new Date('2026-09-26T10:00:00Z') }),
      {
        context: createContext('coordinator', 1),
        isSlugTaken: false,
        now,
        publishedEpisodeCount: 0,
      },
    )

    expect(row.actions[0]).toBe('approve')
    expect(row).toMatchObject({ isIncomplete: true, submission: 'pending' })
  })

  test('a podcast with episodes is never deleted in bulk', () => {
    const row = getPodcastRow(podcast({ _count: { episodes: 2 } }), {
      context: createContext('contributor', 3),
      isSlugTaken: false,
      now,
      publishedEpisodeCount: 1,
    })

    expect(row.actions).toContain('delete')
    expect(row.bulkActions).not.toContain('delete')
    expect(row).toMatchObject({ episodeCount: 2, publishedEpisodeCount: 1 })
  })

  test('a complete podcast whose address another holds is incomplete', () => {
    const complete = podcast({
      cover: {
        altText: '',
        id: 'cover',
        intrinsicHeight: 600,
        intrinsicWidth: 600,
        placeholderDataUrl: '',
        version: 'v1',
      },
      description: 'Rozhovory z kabinetu.',
      submittedAt: new Date('2026-09-26T10:00:00Z'),
    })
    const options = {
      context: createContext('coordinator', 1),
      now,
      publishedEpisodeCount: 0,
    }

    expect(
      getPodcastRow(complete, { ...options, isSlugTaken: false }).isIncomplete,
    ).toBe(false)
    expect(
      getPodcastRow(complete, { ...options, isSlugTaken: true }).isIncomplete,
    ).toBe(true)
  })

  test('while someone else edits it, the Coordinator takes it over and changes no state', () => {
    const row = getPodcastRow(
      podcast({
        heldByAuthor: { name: 'Jakub' },
        heldByAuthorId: 'contributor',
        heldByTabId: 'tab',
        heldSince: new Date('2026-10-29T11:55:00Z'),
        heldUntil: new Date('2026-10-29T12:05:00Z'),
        submittedAt: new Date('2026-09-26T10:00:00Z'),
      }),
      {
        context: createContext('coordinator', 1),
        isSlugTaken: false,
        now,
        publishedEpisodeCount: 0,
      },
    )

    expect(row).toMatchObject({
      heldUntil: '2026-10-29T12:05:00.000Z',
      holdLine: 'upravuje Jakub',
      isHeldByOther: true,
    })
    expect(row.actions).toContain('edit')
    expect(row.actions).not.toContain('approve')
    expect(row.actions).not.toContain('delete')
    // The bar still offers it, and says apart why it is skipped.
    expect(row.bulkActions).toContain('publish')
  })
})
