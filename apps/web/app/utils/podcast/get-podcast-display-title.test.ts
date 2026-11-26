import { describe, expect, test } from 'vitest'

import { getPodcastDisplayTitle } from './get-podcast-display-title'

describe('getPodcastDisplayTitle', () => {
  test('keeps a title', () => {
    expect(getPodcastDisplayTitle('Přestávka')).toBe('Přestávka')
  })

  test('names a blank title', () => {
    expect(getPodcastDisplayTitle('')).toBe('Podcast bez názvu')
    expect(getPodcastDisplayTitle('  ')).toBe('Podcast bez názvu')
  })
})
