import { describe, expect, test } from 'vitest'

import { buildClearFiltersSearch } from './build-clear-filters-search'

describe('buildClearFiltersSearch', () => {
  test('drops the state, the search, the filters and the page', () => {
    expect(
      buildClearFiltersSearch(
        new URLSearchParams(
          'state=draft&state=pending&q=ples&category=skola&tag=ples&author=a1&page=2&filter=abc',
        ),
      ),
    ).toBe('?filter=none')
  })

  test('keeps the sort', () => {
    expect(
      buildClearFiltersSearch(
        new URLSearchParams('state=draft&sort=title&order=asc'),
      ),
    ).toBe('?sort=title&order=asc&filter=none')
  })
})
