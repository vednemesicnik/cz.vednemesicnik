import type { ContentState } from '@generated/prisma/enums'

import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'

type ListedRecord = {
  name: string
  slug: string
  state: ContentState
}

/**
 * Where to go back after adding a record so its row can be seen (design 25c,
 * 8gnyv4wm): the list as it was, unless its state filter or search would hide
 * the new row. Then without them, and without a page, since the row may stand
 * on another one.
 *
 * @param listPath - The list with the query it had when the record was added.
 * @param record - The new record's name, address and state.
 * @returns `listPath`, or the list without the state filter and search; with
 *   `?filter=none` when nothing else is left, so a default saved filter does
 *   not hide the row again.
 */
export const getListPathShowingRecord = (
  listPath: string,
  { name, slug, state }: ListedRecord,
) => {
  const url = new URL(listPath, 'https://list.invalid')
  const parameters = url.searchParams
  const states = parameters.getAll('state')
  const query = (parameters.get('q') ?? '').trim().toLocaleLowerCase('cs')

  const matchesState = states.length === 0 || states.includes(state)
  const matchesQuery =
    query === '' ||
    name.toLocaleLowerCase('cs').includes(query) ||
    slug.includes(query)

  if (matchesState && matchesQuery) {
    return listPath
  }

  parameters.delete('state')
  parameters.delete('q')
  parameters.delete('page')

  if (parameters.size === 0) {
    parameters.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)
  }

  return `${url.pathname}?${parameters}`
}
