import { describe, expect, test } from 'vitest'

import { getPodcastFixTarget } from './get-podcast-fix-target'

const complete = {
  description: 'Popis',
  hasCover: true,
  isSlugTaken: false,
  slug: 'prestavka',
  title: 'Přestávka',
}

describe('getPodcastFixTarget', () => {
  test('a complete podcast has nothing to fix', () => {
    expect(getPodcastFixTarget(complete)).toBeNull()
  })

  test('each missing item maps to its field', () => {
    expect(getPodcastFixTarget({ ...complete, title: ' ' })).toBe('title')
    expect(getPodcastFixTarget({ ...complete, slug: '' })).toBe('slug')
    expect(getPodcastFixTarget({ ...complete, description: '' })).toBe(
      'description',
    )
    expect(getPodcastFixTarget({ ...complete, hasCover: false })).toBe('cover')
  })

  test('the first missing item wins, in the order of the sentence', () => {
    expect(
      getPodcastFixTarget({ ...complete, description: '', hasCover: false }),
    ).toBe('description')
  })

  test('a taken address opens Adresa only when nothing is missing', () => {
    expect(getPodcastFixTarget({ ...complete, isSlugTaken: true })).toBe('slug')
    expect(
      getPodcastFixTarget({ ...complete, hasCover: false, isSlugTaken: true }),
    ).toBe('cover')
  })
})
