import type { ContentState } from '@generated/prisma/enums'

import { PAGE_PARAM } from '~/components/pagination'
import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'
import { SEARCH_PARAM } from '~/utils/admin-list-params'

type ListedRecord = {
  name: string
  slug: string
  state: ContentState
}

// The list searches with SQLite `contains`, which ignores the case of A–Z only.
const foldAsciiCase = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => letter.toLowerCase())

/**
 * Where to go back after adding a record so its row can be seen (design 25c,
 * 8gnyv4wm): the list as it was, unless its state filter or search would hide
 * the new row. Then without them, and without a page, since the row may stand
 * on another one.
 *
 * @param listPath - The list with the query it had when the record was added.
 * @param record - The new record's name, address and state.
 * @returns `listPath`, or the list without the state filter and search, marked
 *   `?filter=none` so neither a saved filter it came from nor a default one
 *   applies to it.
 */
export const getListPathShowingRecord = (
  listPath: string,
  { name, slug, state }: ListedRecord,
) => {
  const url = new URL(listPath, 'https://list.invalid')
  const parameters = url.searchParams
  const states = parameters.getAll('state')
  const query = foldAsciiCase((parameters.get(SEARCH_PARAM) ?? '').trim())

  const matchesState = states.length === 0 || states.includes(state)
  const matchesQuery =
    query === '' ||
    foldAsciiCase(name).includes(query) ||
    foldAsciiCase(slug).includes(query)

  if (matchesState && matchesQuery) {
    return listPath
  }

  parameters.delete('state')
  parameters.delete(SEARCH_PARAM)
  parameters.delete(PAGE_PARAM)
  parameters.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)

  return `${url.pathname}?${parameters}`
}
