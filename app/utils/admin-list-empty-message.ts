type AdminListEmptyMessageOptions = {
  emptyLabel: string
  hasActiveFilters: boolean
  query: string
}

/**
 * Builds the message shown in an admin list's empty row.
 *
 * @param options - `emptyLabel` for the plain empty list, plus whether a field filter
 *   is active and the current search term.
 * @returns The filter message when a filter is active — with both narrowing the list,
 *   the filter is the more likely cause of an empty result — otherwise the search
 *   message, or `emptyLabel` when the list is simply empty.
 */
export const getAdminListEmptyMessage = ({
  emptyLabel,
  hasActiveFilters,
  query,
}: AdminListEmptyMessageOptions): string => {
  if (hasActiveFilters) {
    return 'Žádné výsledky pro zvolené filtry.'
  }

  return query === '' ? emptyLabel : `Nic nenalezeno pro „${query}“`
}
