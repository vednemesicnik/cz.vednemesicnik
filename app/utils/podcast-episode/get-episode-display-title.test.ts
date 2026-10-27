import { describe, expect, test } from 'vitest'

import { getEpisodeDisplayTitle } from './get-episode-display-title'

describe('getEpisodeDisplayTitle', () => {
  test('keeps a title', () => {
    expect(getEpisodeDisplayTitle('Úvod')).toBe('Úvod')
  })

  test('names a blank title', () => {
    expect(getEpisodeDisplayTitle('')).toBe('Epizoda bez názvu')
    expect(getEpisodeDisplayTitle('  ')).toBe('Epizoda bez názvu')
  })
})
