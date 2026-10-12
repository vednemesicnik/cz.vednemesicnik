import { describe, expect, test } from 'vitest'

import { buildListSearch } from './build-list-search'

describe('buildListSearch', () => {
  test('sets the queue and keeps search, filters and sort', () => {
    expect(
      buildListSearch(new URLSearchParams('q=ples&category=skola&sort=title'), {
        state: 'pending',
      }),
    ).toBe('?q=ples&category=skola&sort=title&state=pending')
  })

  test('Vše drops the queue from the URL', () => {
    expect(
      buildListSearch(new URLSearchParams('state=draft'), { state: undefined }),
    ).toBe('')
  })

  test('drops several params and keeps the queue and the search', () => {
    expect(
      buildListSearch(
        new URLSearchParams(
          'state=draft&q=ples&category=skola&tag=ples&author=a1',
        ),
        { author: undefined, category: undefined, tag: undefined },
      ),
    ).toBe('?state=draft&q=ples')
  })

  test('restarts the page', () => {
    expect(
      buildListSearch(new URLSearchParams('state=draft&page=3'), {
        state: 'archived',
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
