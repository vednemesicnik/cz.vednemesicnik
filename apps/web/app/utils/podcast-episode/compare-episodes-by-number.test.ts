import { describe, expect, test } from 'vitest'

import { compareEpisodesByNumber } from './compare-episodes-by-number'

describe('compareEpisodesByNumber', () => {
  test('the highest number first, none last, ties kept', () => {
    const episodes = [
      { id: 'twelve', number: 12 },
      { id: 'none', number: null },
      { id: 'fifteen', number: 15 },
      { id: 'twelve-newer', number: 12 },
    ]

    expect(
      [...episodes].sort(compareEpisodesByNumber).map(({ id }) => id),
    ).toEqual(['fifteen', 'twelve', 'twelve-newer', 'none'])
  })
})
