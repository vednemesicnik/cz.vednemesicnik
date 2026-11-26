import { describe, expect, test } from 'vitest'

import { formatLinkAddress } from './format-link-address'

describe('formatLinkAddress', () => {
  test('drops the scheme', () => {
    expect(formatLinkAddress('https://open.spotify.com/episode/4kQ7')).toBe(
      'open.spotify.com/episode/4kQ7',
    )
  })

  test('drops www. and keeps the query', () => {
    expect(formatLinkAddress('https://www.youtube.com/watch?v=abc')).toBe(
      'youtube.com/watch?v=abc',
    )
  })

  test('drops the lone slash of a bare host', () => {
    expect(formatLinkAddress('https://priklad.cz/')).toBe('priklad.cz')
  })

  test('leaves an address that is not valid as stored', () => {
    expect(formatLinkAddress('spotify kabinet 11')).toBe('spotify kabinet 11')
  })
})
