import { PAGE_PARAM } from '~/components/pagination'
import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'

/**
 * The search of a link that changes the list (design 22a, 22d, 22e): a state
 * pill, a filter chip's ×, Zrušit filtry, Zrušit hledání. The other params
 * stay; the page restarts.
 *
 * @param searchParams - The current URL search params.
 * @param changes - The params to set, or to drop when `undefined`.
 * @returns The search with its `?`, or `''` for a bare list.
 */
export const buildListSearch = (
  searchParams: URLSearchParams,
  changes: Record<string, string | undefined>,
): string => {
  const params = new URLSearchParams(searchParams)

  for (const [name, value] of Object.entries(changes)) {
    if (value === undefined) {
      params.delete(name)
    } else {
      params.set(name, value)
    }
  }

  params.delete(PAGE_PARAM)

  // The list no longer matches its saved filter, as when a select changes.
  if (params.has(FILTER_PRESET_PARAM)) {
    params.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)
  }

  const search = params.toString()

  return search === '' ? '' : `?${search}`
}
