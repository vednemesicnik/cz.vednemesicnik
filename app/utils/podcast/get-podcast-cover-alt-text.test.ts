import { describe, expect, test } from 'vitest'

import { getPodcastCoverAltText } from './get-podcast-cover-alt-text'

describe('getPodcastCoverAltText', () => {
  test('names the podcast', () => {
    expect(getPodcastCoverAltText(' Přestávka ')).toBe(
      'Obálka podcastu Přestávka',
    )
  })

  test('without a title says only what it is', () => {
    expect(getPodcastCoverAltText('')).toBe('Obálka podcastu')
  })
})
