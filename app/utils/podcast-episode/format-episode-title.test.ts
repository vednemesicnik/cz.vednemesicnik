import { describe, expect, test } from 'vitest'

import { formatEpisodeTitle } from './format-episode-title'

describe('formatEpisodeTitle', () => {
  test('puts the number before the title', () => {
    expect(formatEpisodeTitle({ number: 13, title: 'Úvod' })).toBe('#13 Úvod')
  })

  test('leaves the title alone without a number', () => {
    expect(formatEpisodeTitle({ number: null, title: 'Úvod' })).toBe('Úvod')
  })

  test('names an episode without a title', () => {
    expect(formatEpisodeTitle({ number: 14, title: '' })).toBe(
      '#14 Epizoda bez názvu',
    )
    expect(formatEpisodeTitle({ number: null, title: '' })).toBe(
      'Epizoda bez názvu',
    )
  })
})
