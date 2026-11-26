import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'
import { ORDER_PARAM, SORT_PARAM } from '~/utils/admin-list-params'

/**
 * The search of Zrušit filtry (design 22d, 22e): back to the default — every
 * state, no search, no filter — marked explicitly unfiltered, so the default
 * saved filter is not applied again. The sort is no filter and stays.
 *
 * @param searchParams - The current URL search params.
 * @returns The search with its `?`.
 */
export const buildClearFiltersSearch = (
  searchParams: URLSearchParams,
): string => {
  const params = new URLSearchParams()

  for (const name of [SORT_PARAM, ORDER_PARAM]) {
    const value = searchParams.get(name)

    if (value !== null) {
      params.set(name, value)
    }
  }

  params.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)

  return `?${params.toString()}`
}
