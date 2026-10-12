import { describe, expect, test } from 'vitest'

import { getNoResultMessage } from './get-no-result-message'

describe('getNoResultMessage', () => {
  test('a search alone', () => {
    expect(
      getNoResultMessage({ filterCount: 0, query: 'ples', queue: 'draft' }),
    ).toEqual({
      clearLabel: 'Zrušit hledání',
      sentence:
        'V konceptech nejsou články s výrazem „ples“ v názvu nebo adrese.',
    })
  })

  test('filters alone', () => {
    expect(
      getNoResultMessage({ filterCount: 2, query: '', queue: 'draft' }),
    ).toEqual({
      clearLabel: 'Zrušit filtry',
      sentence: 'V konceptech nejsou články odpovídající použitým filtrům (2).',
    })
  })

  test('one filter is singular', () => {
    expect(
      getNoResultMessage({ filterCount: 1, query: '', queue: 'draft' })
        .sentence,
    ).toBe('V konceptech nejsou články odpovídající použitému filtru (1).')
  })

  test('a search and filters', () => {
    expect(
      getNoResultMessage({ filterCount: 2, query: 'ples', queue: 'draft' }),
    ).toEqual({
      clearLabel: 'Zrušit hledání a filtry',
      sentence:
        'V konceptech nejsou články s výrazem „ples“ v názvu nebo adrese, které odpovídají použitým filtrům (2).',
    })
  })

  test.each([
    [undefined, 'Mezi všemi články'],
    ['pending', 'Mezi články ke schválení'],
    ['approved', 'Mezi schválenými články'],
    ['submitted', 'Mezi odeslanými články'],
    ['published', 'Mezi publikovanými články'],
    ['archived', 'Mezi archivovanými články'],
  ] as const)('the %s queue opens with „%s“', (queue, intro) => {
    expect(
      getNoResultMessage({ filterCount: 1, query: '', queue }).sentence,
    ).toMatch(new RegExp(`^${intro} nejsou články `))
  })
})
