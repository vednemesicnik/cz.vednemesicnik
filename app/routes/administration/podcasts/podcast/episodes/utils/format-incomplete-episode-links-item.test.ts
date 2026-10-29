import { describe, expect, test } from 'vitest'

import { formatIncompleteEpisodeLinksItem } from './format-incomplete-episode-links-item'

const COMPLETE = { label: 'Spotify', url: 'https://open.spotify.com/episode/1' }
const NO_LABEL = { label: '', url: 'https://kabinet.priklad.cz/epizody/13' }
const INVALID_URL = { label: 'Spotify', url: 'open.spotify/epizoda-13' }
const EMPTY_URL = { label: 'Apple Podcasts', url: '' }

describe('formatIncompleteEpisodeLinksItem', () => {
  test('says nothing when every link is complete', () => {
    expect(formatIncompleteEpisodeLinksItem([COMPLETE])).toBeNull()
    expect(formatIncompleteEpisodeLinksItem([])).toBeNull()
  })

  test('names the platform name when every incomplete link lacks it', () => {
    expect(formatIncompleteEpisodeLinksItem([COMPLETE, NO_LABEL])).toBe(
      '1 odkaz nemá název platformy.',
    )
    expect(formatIncompleteEpisodeLinksItem([NO_LABEL, NO_LABEL])).toBe(
      '2 odkazy nemají název platformy.',
    )
    expect(formatIncompleteEpisodeLinksItem(Array(5).fill(NO_LABEL))).toBe(
      '5 odkazů nemá název platformy.',
    )
  })

  test('names the address when every incomplete link lacks a valid one', () => {
    expect(formatIncompleteEpisodeLinksItem([INVALID_URL])).toBe(
      '1 odkaz nemá platnou adresu.',
    )
    expect(formatIncompleteEpisodeLinksItem([INVALID_URL, EMPTY_URL])).toBe(
      '2 odkazy nemají platnou adresu.',
    )
    expect(formatIncompleteEpisodeLinksItem(Array(5).fill(EMPTY_URL))).toBe(
      '5 odkazů nemá platnou adresu.',
    )
  })

  test('says incomplete when the links lack different things', () => {
    expect(formatIncompleteEpisodeLinksItem([NO_LABEL, INVALID_URL])).toBe(
      '2 odkazy nejsou úplné.',
    )
    expect(
      formatIncompleteEpisodeLinksItem([
        NO_LABEL,
        INVALID_URL,
        NO_LABEL,
        NO_LABEL,
        INVALID_URL,
      ]),
    ).toBe('5 odkazů není úplných.')
  })

  test('says incomplete when one link lacks both', () => {
    expect(formatIncompleteEpisodeLinksItem([{ label: '', url: 'x' }])).toBe(
      '1 odkaz není úplný.',
    )
  })
})
