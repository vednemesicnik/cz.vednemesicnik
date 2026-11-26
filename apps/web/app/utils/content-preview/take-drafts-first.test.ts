import { describe, expect, test } from 'vitest'

import { takeDraftsFirst } from './take-drafts-first'

describe('takeDraftsFirst', () => {
  test('puts the drafts before the rest', () => {
    expect(takeDraftsFirst(['d1'], ['p1', 'p2'], 6)).toEqual(['d1', 'p1', 'p2'])
  })

  test('cuts the list at the count', () => {
    expect(takeDraftsFirst(['d1', 'd2'], ['p1', 'p2'], 3)).toEqual([
      'd1',
      'd2',
      'p1',
    ])
  })

  test('fills the list with drafts alone when there are enough', () => {
    expect(takeDraftsFirst(['d1', 'd2', 'd3'], ['p1'], 2)).toEqual(['d1', 'd2'])
  })
})
