import { describe, expect, it } from 'vitest'

import {
  AUTHOR_COUNT_FORMS,
  CATEGORY_NOUN,
  TAG_NOUN,
  USER_COUNT_FORMS,
} from '~/config/list-noun-config'

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
    expect(formatListCount(count, CATEGORY_NOUN.countForms)).toBe(expected)
  })

  it.each([
    [1, '1 štítek'],
    [3, '3 štítky'],
    [12, '12 štítků'],
  ])('formats %i tags as "%s"', (count, expected) => {
    expect(formatListCount(count, TAG_NOUN.countForms)).toBe(expected)
  })

  it.each([
    [1, '1 autor'],
    [2, '2 autoři'],
    [5, '5 autorů'],
  ])('formats %i authors as "%s"', (count, expected) => {
    expect(formatListCount(count, AUTHOR_COUNT_FORMS)).toBe(expected)
  })

  it.each([
    [1, '1 uživatel'],
    [3, '3 uživatelé'],
    [6, '6 uživatelů'],
  ])('formats %i users as "%s"', (count, expected) => {
    expect(formatListCount(count, USER_COUNT_FORMS)).toBe(expected)
  })
})
