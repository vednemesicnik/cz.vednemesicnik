import { describe, expect, test } from 'vitest'

import { getAdminListEmptyMessage } from '~/utils/admin-list-empty-message'

describe('getAdminListEmptyMessage', () => {
  test('should return the plain label for an empty unfiltered list', () => {
    expect(
      getAdminListEmptyMessage({
        emptyLabel: 'Žádné články',
        hasActiveFilters: false,
        query: '',
      }),
    ).toBe('Žádné články')
  })

  test('should return the search message when a search term is set', () => {
    expect(
      getAdminListEmptyMessage({
        emptyLabel: 'Žádné články',
        hasActiveFilters: false,
        query: 'škola',
      }),
    ).toBe('Nic nenalezeno pro „škola“')
  })

  test('should prefer the filter message over the search message', () => {
    expect(
      getAdminListEmptyMessage({
        emptyLabel: 'Žádné články',
        hasActiveFilters: true,
        query: 'škola',
      }),
    ).toBe('Žádné výsledky pro zvolené filtry.')
  })
})
