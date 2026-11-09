import { describe, expect, test } from 'vitest'

import { sortByNewestEpisode } from './sort-by-newest-episode'

const podcast = (id: string, publishedAt?: string) => ({
  episodes:
    publishedAt === undefined ? [] : [{ publishedAt: new Date(publishedAt) }],
  id,
})

const ids = (podcasts: { id: string }[]) => podcasts.map(({ id }) => id)

describe('sortByNewestEpisode', () => {
  test('puts the podcast with the newest episode first', () => {
    const podcasts = [
      podcast('monthly', '2026-10-01T00:00:00Z'),
      podcast('weekly', '2026-11-02T00:00:00Z'),
    ]

    expect(ids(sortByNewestEpisode(podcasts))).toEqual(['weekly', 'monthly'])
  })

  test('puts a podcast without an episode last, keeping their order', () => {
    const podcasts = [
      podcast('empty-newer'),
      podcast('weekly', '2026-11-02T00:00:00Z'),
      podcast('empty-older'),
    ]

    expect(ids(sortByNewestEpisode(podcasts))).toEqual([
      'weekly',
      'empty-newer',
      'empty-older',
    ])
  })

  test('keeps the input order on a tie', () => {
    const podcasts = [
      podcast('first', '2026-11-02T00:00:00Z'),
      podcast('second', '2026-11-02T00:00:00Z'),
    ]

    expect(ids(sortByNewestEpisode(podcasts))).toEqual(['first', 'second'])
  })

  test('leaves the input untouched', () => {
    const podcasts = [
      podcast('empty'),
      podcast('weekly', '2026-11-02T00:00:00Z'),
    ]

    sortByNewestEpisode(podcasts)

    expect(ids(podcasts)).toEqual(['empty', 'weekly'])
  })
})
