import { describe, expect, test } from 'vitest'

import { getLinkPlatform } from './get-link-platform'

describe('getLinkPlatform', () => {
  test.each([
    ['https://open.spotify.com/episode/7hT2', 'Spotify'],
    ['https://podcasts.apple.com/cz/podcast/kabinet/id17', 'Apple Podcasts'],
    ['https://www.youtube.com/watch?v=1', 'YouTube'],
    ['https://m.youtube.com/watch?v=1', 'YouTube'],
    ['https://youtu.be/1', 'YouTube'],
    ['https://music.youtube.com/watch?v=1', 'YouTube'],
    ['https://soundcloud.com/kabinet/13', 'SoundCloud'],
    ['http://on.soundcloud.com/abc', 'SoundCloud'],
  ])('names the platform of %s', (url, platform) => {
    expect(getLinkPlatform(url)).toBe(platform)
  })

  test.each([
    'https://kabinet.priklad.cz/epizody/13',
    'open.spotify/epizoda-13',
    'ftp://open.spotify.com/episode/1',
    '',
  ])('names none for %s', (url) => {
    expect(getLinkPlatform(url)).toBeNull()
  })
})
