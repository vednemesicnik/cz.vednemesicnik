import { describe, expect, test } from 'vitest'

import { getEpisodeCoverAltText } from './get-episode-cover-alt-text'

describe('getEpisodeCoverAltText', () => {
  test.each([
    [
      { number: 14, title: 'Školník, který ví všechno' },
      'Obálka epizody 14: Školník, který ví všechno',
    ],
    [
      { number: null, title: '3 tipy na zkouškové' },
      'Obálka epizody: 3 tipy na zkouškové',
    ],
    [{ number: 14, title: '' }, 'Obálka epizody 14'],
    [{ number: null, title: '  ' }, 'Obálka epizody'],
  ])('composes %o as %s', (options, expected) => {
    expect(getEpisodeCoverAltText(options)).toBe(expected)
  })
})
