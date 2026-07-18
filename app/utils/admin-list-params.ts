import { PAGE_PARAM } from '~/components/pagination'

export const SORT_PARAM = 'sort'
export const ORDER_PARAM = 'order'
export const SEARCH_PARAM = 'q'

export type SortOrder = 'asc' | 'desc'

type ParseOptions<TSortKey extends string> = {
  sortKeys: readonly TSortKey[]
  defaultSort: TSortKey
  defaultOrder?: SortOrder
}

// SQLite search limitation for later consumers: Prisma on SQLite has no
// `mode: 'insensitive'`; `contains` is case-insensitive only for ASCII, so Czech
// diacritics match case-sensitively. Accepted limitation.

// Parses and validates ?q=&sort=&order=&page= from a Request URL.
export const parseAdminListParams = <TSortKey extends string>(
  request: Request,
  options: ParseOptions<TSortKey>,
): { query: string; sort: TSortKey; order: SortOrder; page: number } => {
  const url = new URL(request.url)

  const rawSort = url.searchParams.get(SORT_PARAM)
  const sort = options.sortKeys.includes(rawSort as TSortKey)
    ? (rawSort as TSortKey)
    : options.defaultSort

  const rawOrder = url.searchParams.get(ORDER_PARAM)
  const order: SortOrder =
    rawOrder === 'asc' || rawOrder === 'desc'
      ? rawOrder
      : (options.defaultOrder ?? 'asc')

  const query = (url.searchParams.get(SEARCH_PARAM) ?? '').trim()

  const page = Math.max(1, Number(url.searchParams.get(PAGE_PARAM) ?? '1') || 1)

  return { order, page, query, sort }
}

// Builds the next search string for a sortable header link. Toggle cycle for a given
// `sortKey`: inactive -> asc -> desc -> cleared (removes sort/order, back to loader
// default). Preserves all other params (q, ...), always deletes page. Returns a
// `?`-prefixed string when non-empty, `''` when empty (mirrors Pagination links).
export const buildSortSearch = (
  currentSearch: string,
  sortKey: string,
): string => {
  const params = new URLSearchParams(currentSearch)

  const currentSort = params.get(SORT_PARAM)
  const currentOrder = params.get(ORDER_PARAM)

  if (currentSort !== sortKey) {
    params.set(SORT_PARAM, sortKey)
    params.set(ORDER_PARAM, 'asc')
  } else if (currentOrder === 'desc') {
    params.delete(SORT_PARAM)
    params.delete(ORDER_PARAM)
  } else {
    // Active sort in the asc state (or a missing/invalid order) -> advance to desc.
    params.set(ORDER_PARAM, 'desc')
  }

  params.delete(PAGE_PARAM)

  const search = params.toString()
  return search ? `?${search}` : ''
}
