import { describe, expect, test } from 'vitest'

import { composeLiveSection } from './compose-live-section'

const item = (key: string, state: string) => ({ key, state })

describe('composeLiveSection', () => {
  const shown = [
    item('article:a', 'pending'),
    item('episode:b', 'pending'),
    item('issue:c', 'pending'),
  ]

  test('a row taken back stays in place with its new state', () => {
    const rows = composeLiveSection({
      appendsNew: true,
      fresh: [item('article:a', 'pending'), item('issue:c', 'pending')],
      pinned: [
        item('article:a', 'pending'),
        item('episode:b', 'draft'),
        item('issue:c', 'pending'),
      ],
      shown,
    })

    expect(rows).toEqual([
      item('article:a', 'pending'),
      item('episode:b', 'draft'),
      item('issue:c', 'pending'),
    ])
  })

  test('a newly submitted row joins the queue at its end', () => {
    const rows = composeLiveSection({
      appendsNew: true,
      fresh: [...shown, item('tag:d', 'pending')],
      pinned: shown,
      shown,
    })

    expect(rows.map(({ key }) => key)).toEqual([
      'article:a',
      'episode:b',
      'issue:c',
      'tag:d',
    ])
  })

  test('outside the queue a new row waits, and a deleted one goes', () => {
    const rows = composeLiveSection({
      appendsNew: false,
      fresh: [item('article:a', 'draft'), item('tag:d', 'draft')],
      pinned: [item('article:a', 'draft'), item('issue:c', 'draft')],
      shown,
    })

    expect(rows.map(({ key }) => key)).toEqual(['article:a', 'issue:c'])
  })
})
