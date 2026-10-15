import { describe, expect, it } from 'vitest'

import { CATEGORY_NOUN, TAG_NOUN } from '~/config/list-noun-config'

import { formatListCount } from './format-list-count'

describe('formatListCount', () => {
  it.each([
    [0, '0 rubrik'],
    [1, '1 rubrika'],
    [2, '2 rubriky'],
    [4, '4 rubriky'],
    [5, '5 rubrik'],
    [7, '7 rubrik'],
  ])('formats %i categories as "%s"', (count, expected) => {
    expect(formatListCount(count, CATEGORY_NOUN)).toBe(expected)
  })

  it.each([
    [1, '1 štítek'],
    [3, '3 štítky'],
    [12, '12 štítků'],
  ])('formats %i tags as "%s"', (count, expected) => {
    expect(formatListCount(count, TAG_NOUN)).toBe(expected)
  })
})
