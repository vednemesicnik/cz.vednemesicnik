import { PAGE_PARAM } from '~/components/pagination'

/**
 * Builds the redirect target for a list page past the last: the same URL with
 * `page` set to the last page, or dropped when that is page 1. Every other param
 * (filters, search, sort, preset) is kept.
 *
 * @param url - The normalized URL of the list request.
 * @param totalPages - The pages the list has; 0 for an empty list.
 * @returns The pathname, followed by the search string when one remains.
 */
export const buildLastPageRedirect = (url: URL, totalPages: number): string => {
  const searchParams = new URLSearchParams(url.searchParams)
  const lastPage = Math.max(totalPages, 1)

  if (lastPage === 1) {
    searchParams.delete(PAGE_PARAM)
  } else {
    searchParams.set(PAGE_PARAM, String(lastPage))
  }

  const search = searchParams.toString()

  return search === '' ? url.pathname : `${url.pathname}?${search}`
}
