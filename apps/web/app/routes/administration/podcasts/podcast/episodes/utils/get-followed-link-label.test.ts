import { describe, expect, test } from 'vitest'

import { getFollowedLinkLabel } from './get-followed-link-label'

const SPOTIFY = 'https://open.spotify.com/episode/7hT2'
const APPLE = 'https://podcasts.apple.com/cz/podcast/kabinet/id17'
const UNKNOWN = 'https://kabinet.priklad.cz/epizody/13'

describe('getFollowedLinkLabel', () => {
  test('an empty label fills from a known address', () => {
    expect(
      getFollowedLinkLabel({ label: '', previousUrl: '', url: SPOTIFY }),
    ).toBe('Spotify')
  })

  test('a filled label follows the address to another platform', () => {
    expect(
      getFollowedLinkLabel({
        label: 'Spotify',
        previousUrl: SPOTIFY,
        url: APPLE,
      }),
    ).toBe('Apple Podcasts')
  })

  test('a filled label empties for an unknown or invalid address', () => {
    expect(
      getFollowedLinkLabel({
        label: 'Spotify',
        previousUrl: SPOTIFY,
        url: UNKNOWN,
      }),
    ).toBe('')
    expect(
      getFollowedLinkLabel({
        label: 'Spotify',
        previousUrl: SPOTIFY,
        url: 'open.spotify/13',
      }),
    ).toBe('')
  })

  test('a name changed by hand stays', () => {
    expect(
      getFollowedLinkLabel({
        label: 'Kabinet na Spotify',
        previousUrl: SPOTIFY,
        url: APPLE,
      }),
    ).toBe('Kabinet na Spotify')
  })
})
