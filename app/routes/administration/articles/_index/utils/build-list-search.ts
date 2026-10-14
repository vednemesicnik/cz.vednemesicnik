import { PAGE_PARAM } from '~/components/pagination'
import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'

/**
 * The search of a link or a menu choice that changes the list's filters (design
 * 22a, 22d). The other params stay; the page restarts.
 *
 * @param searchParams - The current URL search params.
 * @param changes - The values to set per param, repeated in the given order,
 *   or `undefined` (or no values) to drop the param.
 * @returns The search with its `?`, or `''` for a bare list.
 */
export const buildListSearch = (
  searchParams: URLSearchParams,
  changes: Record<string, string[] | undefined>,
): string => {
  const params = new URLSearchParams(searchParams)

  for (const [name, values] of Object.entries(changes)) {
    params.delete(name)

    for (const value of values ?? []) {
      params.append(name, value)
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
