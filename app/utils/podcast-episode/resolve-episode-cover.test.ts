import { describe, expect, test } from 'vitest'

import { resolveEpisodeCover } from './resolve-episode-cover'

const row = (id: string, altText: string) => ({
  altText,
  id,
  intrinsicHeight: 220,
  intrinsicWidth: 220,
  placeholderDataUrl: 'data:image/jpeg;base64,',
  version: 'v1',
})

describe('resolveEpisodeCover', () => {
  test("takes the episode's own cover", () => {
    const cover = resolveEpisodeCover({
      cover: row('episode', 'Obálka epizody 11'),
      podcastCover: row('podcast', 'Obálka podcastu Kabinet'),
    })

    expect(cover?.altText).toBe('Obálka epizody 11')
    expect(cover?.sources.src).toContain('podcast-episode-cover')
  })

  test("falls back to the podcast's cover", () => {
    const cover = resolveEpisodeCover({
      cover: null,
      podcastCover: row('podcast', 'Obálka podcastu Kabinet'),
    })

    expect(cover?.altText).toBe('Obálka podcastu Kabinet')
    expect(cover?.sources.src).toContain('podcast-cover')
  })

  test('is null without either cover', () => {
    expect(resolveEpisodeCover({ cover: null, podcastCover: null })).toBeNull()
  })
})
