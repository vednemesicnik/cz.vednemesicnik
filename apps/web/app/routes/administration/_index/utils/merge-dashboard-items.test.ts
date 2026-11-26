import { describe, expect, test } from 'vitest'

import { mergeDashboardItems } from './merge-dashboard-items'

const item = (key: string, sortAt: string | null) => ({ key, sortAt })

describe('mergeDashboardItems', () => {
  test('the queue runs oldest first across the types', () => {
    const merged = mergeDashboardItems(
      [
        [
          item('article:a', '2026-09-25T10:00:00.000Z'),
          item('article:b', '2026-09-27T10:00:00.000Z'),
        ],
        [item('issue:c', '2026-09-26T10:00:00.000Z')],
      ],
      { direction: 'asc' },
    )

    expect(merged.map(({ key }) => key)).toEqual([
      'article:a',
      'issue:c',
      'article:b',
    ])
  })

  test('newest first, cut to the section length', () => {
    const merged = mergeDashboardItems(
      [
        [item('article:a', '2026-09-20T10:00:00.000Z')],
        [
          item('episode:b', '2026-10-29T09:40:00.000Z'),
          item('episode:c', '2026-09-22T10:00:00.000Z'),
        ],
      ],
      { direction: 'desc', take: 2 },
    )

    expect(merged.map(({ key }) => key)).toEqual(['episode:b', 'episode:c'])
  })

  test('a row without the moment goes last', () => {
    const merged = mergeDashboardItems(
      [
        [
          item('article:a', null),
          item('article:b', '2026-09-20T10:00:00.000Z'),
        ],
      ],
      { direction: 'desc' },
    )

    expect(merged.map(({ key }) => key)).toEqual(['article:b', 'article:a'])
  })
})
