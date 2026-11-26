import { PINNED_ROWS_PARAM } from './pinned-rows-param'

/**
 * The rows on screen a live load asks for (design 22f): a list's loader then
 * returns fresh data for exactly those rows, whatever the order, filters or
 * page now say, and never redirects, since a fetcher loads it.
 *
 * @param url - The loader's URL.
 * @param pageSize - The list's page, which caps how many rows are asked for.
 * @returns The row ids, or `undefined` for an ordinary load of the list.
 */
export const parsePinnedRowIds = (url: URL, pageSize: number) =>
  url.searchParams
    .get(PINNED_ROWS_PARAM)
    ?.split(',')
    .filter((id) => id !== '')
    .slice(0, pageSize)
