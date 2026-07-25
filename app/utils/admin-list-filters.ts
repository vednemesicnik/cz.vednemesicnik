import { ContentState } from '@generated/prisma/enums'
import { z } from 'zod'

import { PAGE_PARAM } from '~/components/pagination'

export type AdminListTableKey =
  | 'archive'
  | 'article_categories'
  | 'article_tags'
  | 'articles'
  | 'authors'
  | 'podcast_episodes'
  | 'podcasts'
  | 'users'

const stateFilter = z.enum(ContentState).optional()

// `.min(1)` so an empty value (`?category=`, the "Vše" option) is dropped
// instead of being kept as an empty string.
const slugFilter = z.string().min(1).optional()

const contentStateOnly = z.object({ state: stateFilter })
const roleOnly = z.object({ role: slugFilter })

// Central registry: the saved-filters backend has to validate a stored query
// string for an arbitrary table, so the lookup is keyed by table, not by route.
// `satisfies` (instead of a `Record<...>` annotation) keeps the per-table
// literal types, which `parseAdminListFilters` infers from.
export const ADMIN_LIST_FILTER_SCHEMAS = {
  archive: contentStateOnly,
  article_categories: contentStateOnly,
  article_tags: contentStateOnly,
  articles: z.object({
    author: slugFilter,
    category: slugFilter,
    state: stateFilter,
    tag: slugFilter,
  }),
  authors: roleOnly,
  podcast_episodes: contentStateOnly,
  podcasts: contentStateOnly,
  users: roleOnly,
} satisfies Record<AdminListTableKey, z.ZodObject>

const getFilterKeys = (tableKey: AdminListTableKey): string[] =>
  Object.keys(ADMIN_LIST_FILTER_SCHEMAS[tableKey].shape)

// Validates field by field so one bad value cannot discard its valid siblings.
const pickValidFilters = (
  searchParams: URLSearchParams,
  tableKey: AdminListTableKey,
): Record<string, string> => {
  const shape = ADMIN_LIST_FILTER_SCHEMAS[tableKey].shape as Record<
    string,
    z.ZodType<string | undefined>
  >

  const values: Record<string, string> = {}

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const rawValue = searchParams.get(key)

    if (rawValue === null) {
      continue
    }

    const result = fieldSchema.safeParse(rawValue)

    if (result.success && result.data !== undefined) {
      values[key] = result.data
    }
  }

  return values
}

/**
 * Reads the table's filter params from a Request URL.
 *
 * @param request - The incoming request whose URL carries the filter params.
 * @param tableKey - Which admin table's schema to validate against.
 * @returns The valid filter values; invalid or unknown params are dropped, never thrown.
 */
export const parseAdminListFilters = <TKey extends AdminListTableKey>(
  request: Request,
  tableKey: TKey,
): z.infer<(typeof ADMIN_LIST_FILTER_SCHEMAS)[TKey]> => {
  const { searchParams } = new URL(request.url)

  return pickValidFilters(searchParams, tableKey) as z.infer<
    (typeof ADMIN_LIST_FILTER_SCHEMAS)[TKey]
  >
}

/**
 * Extracts only the table's filter params from a search string and serializes them
 * canonically — schema key order, invalid and empty values dropped — so that two
 * equal filters always produce the same string. Used to snapshot the current filter
 * for saving and to re-validate stored snapshots.
 *
 * @param search - A search string, with or without the leading `?`.
 * @param tableKey - Which admin table's schema to validate against.
 * @returns The canonical query string without a leading `?`, or `''` when nothing is valid.
 */
export const extractAdminListFilterSearch = (
  search: string,
  tableKey: AdminListTableKey,
): string => {
  const values = pickValidFilters(new URLSearchParams(search), tableKey)
  const canonical = new URLSearchParams()

  for (const key of getFilterKeys(tableKey)) {
    const value = values[key]

    if (value !== undefined) {
      canonical.set(key, value)
    }
  }

  return canonical.toString()
}

/**
 * Builds the redirect target that strips filter params whose value is no longer
 * offered — a deleted category, an author that lost its last visible article.
 * Left in place, such a value keeps narrowing the list while its select, having
 * no matching option, falls back to "Vše". Pass only the data-driven params;
 * enum-backed ones like `state` are already covered by the schema.
 *
 * @param url - The request's normalized URL (React Router's `url` loader arg).
 * @param optionsByParam - The offered options, keyed by filter param name.
 * @returns The path to redirect to, or `null` when every value is still offered.
 */
export const buildStaleFilterRedirect = (
  url: URL,
  optionsByParam: Record<string, { value: string }[]>,
): string | null => {
  const staleParams = Object.entries(optionsByParam)
    .filter(([param, options]) => {
      const value = url.searchParams.get(param)

      // An empty value is the "Vše" option, which the parser drops anyway.
      return (
        value !== null &&
        value !== '' &&
        !options.some((option) => option.value === value)
      )
    })
    .map(([param]) => param)

  if (staleParams.length === 0) {
    return null
  }

  const searchParams = new URLSearchParams(url.searchParams)

  for (const param of staleParams) {
    searchParams.delete(param)
  }

  // The result set widens, so the current page may no longer exist.
  searchParams.delete(PAGE_PARAM)

  const search = searchParams.toString()

  return search === '' ? url.pathname : `${url.pathname}?${search}`
}

/**
 * Collects the params a filter submit has to carry over as hidden inputs — everything
 * except the table's own filter params (the form owns those) and `page` (changing a
 * filter resets pagination). Mirrors how `AdminTableSearch` preserves params.
 *
 * @param searchParams - The current URL search params.
 * @param tableKey - Which admin table's filter params the form owns.
 * @returns Name/value entries to render as hidden inputs.
 */
export const getPreservedFilterParams = (
  searchParams: URLSearchParams,
  tableKey: AdminListTableKey,
): [string, string][] => {
  const preserved = new URLSearchParams(searchParams)

  for (const key of getFilterKeys(tableKey)) {
    preserved.delete(key)
  }

  preserved.delete(PAGE_PARAM)

  return [...preserved.entries()]
}
