import { describe, expect, test } from 'vitest'

import { getEpisodeFactLine } from './get-episode-fact-line'

const episode = {
  authorName: 'Anna Dvořáková',
  submission: null,
  updatedAt: new Date('2026-09-01T10:00:00Z'),
}

describe('getEpisodeFactLine', () => {
  test('a draft names its author', () => {
    expect(getEpisodeFactLine({ ...episode, state: 'draft' })).toBe(
      'Anna Dvořáková',
    )
  })

  test('a waiting one says since when', () => {
    expect(
      getEpisodeFactLine({
        ...episode,
        state: 'draft',
        submission: {
          date: new Date('2026-09-25T10:00:00Z'),
          state: 'pending',
        },
      }),
    ).toBe('Anna Dvořáková · od 25. 9. 2026')
  })

  test('an approved one says when', () => {
    expect(
      getEpisodeFactLine({
        ...episode,
        state: 'draft',
        submission: {
          date: new Date('2026-09-26T10:00:00Z'),
          state: 'approved',
        },
      }),
    ).toBe('Anna Dvořáková · 26. 9. 2026')
  })

  test('a published one has none', () => {
    expect(getEpisodeFactLine({ ...episode, state: 'published' })).toBeNull()
  })

  test('an archived one says when', () => {
    expect(getEpisodeFactLine({ ...episode, state: 'archived' })).toBe(
      '1. 9. 2026',
    )
  })
})
