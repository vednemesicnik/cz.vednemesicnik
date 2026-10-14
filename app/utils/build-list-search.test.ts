import { describe, expect, test } from 'vitest'

import { buildListSearch } from './build-list-search'

describe('buildListSearch', () => {
  test('sets the state and keeps search, filters and sort', () => {
    expect(
      buildListSearch(new URLSearchParams('q=ples&category=skola&sort=title'), {
        state: ['pending'],
      }),
    ).toBe('?q=ples&category=skola&sort=title&state=pending')
  })

  test('repeats a param for several values in the given order', () => {
    expect(
      buildListSearch(new URLSearchParams('category=skola&q=ples'), {
        category: ['kultura', 'skola'],
      }),
    ).toBe('?q=ples&category=kultura&category=skola')
  })

  test('Vše drops the state from the URL', () => {
    expect(
      buildListSearch(new URLSearchParams('state=draft&state=pending'), {
        state: undefined,
      }),
    ).toBe('')
  })

  test('no values drops the param', () => {
    expect(
      buildListSearch(new URLSearchParams('tag=ples&state=draft'), { tag: [] }),
    ).toBe('?state=draft')
  })

  test('restarts the page', () => {
    expect(
      buildListSearch(new URLSearchParams('state=draft&page=3'), {
        state: ['archived'],
      }),
    ).toBe('?state=archived')
  })

  test('the saved filter marker becomes explicitly unfiltered', () => {
    expect(
      buildListSearch(new URLSearchParams('filter=abc&state=draft'), {
        state: undefined,
      }),
    ).toBe('?filter=none')
  })
})
