import { describe, expect, test } from 'vitest'

import { getPodcastFactLine } from './get-podcast-fact-line'

const podcast = {
  authorName: 'Tomáš Kříž',
  submission: null,
  submittedByName: null,
  updatedAt: new Date('2026-01-03T10:00:00Z'),
}

describe('getPodcastFactLine', () => {
  test('a draft names its author', () => {
    expect(getPodcastFactLine({ ...podcast, state: 'draft' })).toBe(
      'Autor: Tomáš Kříž',
    )
  })

  test('a waiting one says who sent it and when', () => {
    expect(
      getPodcastFactLine({
        ...podcast,
        state: 'draft',
        submission: {
          date: new Date('2026-09-26T10:00:00Z'),
          state: 'pending',
        },
        submittedByName: 'Jakub Novák',
      }),
    ).toBe('Odesláno · Jakub Novák · 26. 9. 2026')
  })

  test('an archived one says when', () => {
    expect(getPodcastFactLine({ ...podcast, state: 'archived' })).toBe(
      'Archivováno 3. 1. 2026',
    )
  })

  test('a published one has none', () => {
    expect(getPodcastFactLine({ ...podcast, state: 'published' })).toBeNull()
  })
})
