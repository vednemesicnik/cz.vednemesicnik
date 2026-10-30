import { describe, expect, test } from 'vitest'

import { formatLinkHost } from './format-link-host'

describe('formatLinkHost', () => {
  test.each([
    ['https://open.spotify.com/episode/4kQ', 'open.spotify.com'],
    ['https://www.youtube.com/watch?v=abc', 'youtube.com'],
    ['https://podcasts.apple.com/cz/podcast/x/id1', 'podcasts.apple.com'],
  ])('formats %s as %s', (url, expected) => {
    expect(formatLinkHost(url)).toBe(expected)
  })

  test('returns null for an address that does not parse', () => {
    expect(formatLinkHost('open.spotify')).toBeNull()
  })
})
