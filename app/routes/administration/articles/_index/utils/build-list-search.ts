import { PAGE_PARAM } from '~/components/pagination'
import type { ArticleQueue } from '~/config/article-queue-config'
import {
  FILTER_PRESET_NONE,
  FILTER_PRESET_PARAM,
} from '~/utils/admin-list-filters'

/**
 * The search of a state pill's link (design 22a): the current list in another
 * queue. Search, filters and sort stay; the page restarts.
 *
 * @param searchParams - The current URL search params.
 * @param queue - The pill's queue, or `undefined` for Vše, which is not written.
 * @returns The search with its `?`, or `''` for a bare list.
 */
export const buildQueueSearch = (
  searchParams: URLSearchParams,
  queue: ArticleQueue | undefined,
): string => {
  const params = new URLSearchParams(searchParams)

  if (queue === undefined) {
    params.delete('state')
  } else {
    params.set('state', queue)
  }

  params.delete(PAGE_PARAM)

  // The list no longer matches its saved filter, as when a select changes.
  if (params.has(FILTER_PRESET_PARAM)) {
    params.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)
  }

  const search = params.toString()

  return search === '' ? '' : `?${search}`
}
