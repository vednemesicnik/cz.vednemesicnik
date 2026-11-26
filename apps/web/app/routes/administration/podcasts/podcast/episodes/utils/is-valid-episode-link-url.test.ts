import { describe, expect, test } from 'vitest'

import { isValidEpisodeLinkUrl } from './is-valid-episode-link-url'

describe('isValidEpisodeLinkUrl', () => {
  test.each([
    'https://open.spotify.com/episode/7hT2',
    'http://kabinet.priklad.cz/epizody/13',
  ])('accepts %s', (url) => {
    expect(isValidEpisodeLinkUrl(url)).toBe(true)
  })

  test.each([
    '',
    'open.spotify/epizoda-13',
    'ftp://priklad.cz/epizoda.mp3',
    'mailto:redakce@priklad.cz',
  ])('refuses %j', (url) => {
    expect(isValidEpisodeLinkUrl(url)).toBe(false)
  })
})
