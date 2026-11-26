import { describe, expect, test } from 'vitest'

import { buildDashboardSectionWhere } from './build-dashboard-section-where'

const own = { authorId: 'author-1' }

describe('buildDashboardSectionWhere', () => {
  test('Rozepsané holds one’s own drafts only', () => {
    expect(
      buildDashboardSectionWhere(
        { ownOnly: true, queues: ['draft'] },
        'issue',
        own,
      ),
    ).toEqual({
      AND: [own, { OR: [{ state: 'draft', submittedAt: null }] }],
    })
  })

  test('the queue is everyone’s waiting content', () => {
    const where = buildDashboardSectionWhere(
      { ownOnly: false, queues: ['pending'] },
      'podcast',
      own,
    )

    expect(where?.AND?.[0]).toEqual({})
  })

  test('Odeslané keeps what was published since the given day', () => {
    const publishedSince = new Date('2026-10-15T12:00:00Z')

    expect(
      buildDashboardSectionWhere(
        { ownOnly: true, publishedSince, queues: ['submitted'] },
        'article',
        own,
      )?.AND?.[1],
    ).toEqual({
      OR: [
        { state: 'draft', submittedAt: { not: null } },
        { publishedAt: { gte: publishedSince }, state: 'published' },
      ],
    })
  })

  test('a live load takes only the keys of its type', () => {
    const selection = { keys: ['article:a', 'tag:b', 'tag:', 'nonsense'] }

    expect(buildDashboardSectionWhere(selection, 'tag', own)).toEqual({
      id: { in: ['b'] },
    })
    expect(buildDashboardSectionWhere(selection, 'issue', own)).toBeNull()
  })
})
