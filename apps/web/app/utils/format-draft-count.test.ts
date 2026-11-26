import { describe, expect, it } from 'vitest'
import { formatDraftCount } from './format-draft-count'

describe('formatDraftCount', () => {
  it.each([
    [0, '0 konceptů'],
    [1, '1 koncept'],
    [3, '3 koncepty'],
    [5, '5 konceptů'],
    [20, '20 konceptů'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatDraftCount(count)).toBe(expected)
  })
})
