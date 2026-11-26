import { describe, expect, it } from 'vitest'

import { formatPublishedEpisodeCount } from './format-published-episode-count'

describe('formatPublishedEpisodeCount', () => {
  it.each([
    [1, '1 publikovaná epizoda'],
    [2, '2 publikované epizody'],
    [4, '4 publikované epizody'],
    [5, '5 publikovaných epizod'],
    [11, '11 publikovaných epizod'],
    [21, '21 publikovaných epizod'],
    [22, '22 publikovaných epizod'],
  ])('formats %i as "%s"', (count, expected) => {
    expect(formatPublishedEpisodeCount(count)).toBe(expected)
  })
})
