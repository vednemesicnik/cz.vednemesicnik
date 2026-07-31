import {
  AuthorRoleName,
  ContentState,
  type FilterTable,
  UserRoleName,
} from '@generated/prisma/enums'
import { z } from 'zod'

import { PAGE_PARAM } from '~/components/pagination'
import {
  ORDER_PARAM,
  SEARCH_PARAM,
  SORT_PARAM,
} from '~/utils/admin-list-params'

// Aliased to the Prisma enum backing `Filter.tableKey` so the saved-filters
// column and the registry below cannot drift apart: adding a table on only one
// side breaks the `satisfies` check on `ADMIN_LIST_FILTER_SCHEMAS`.
export type AdminListTableKey = FilterTable

// Marks which saved filter the current list state came from: it highlights the
// preset in the menu and picks the target of an overwrite. Navigation state, not
// a filter value — stored queries never contain it.
export const FILTER_PRESET_PARAM = 'filter'

// "Explicitly unfiltered": suppresses the default-filter redirect, which would
// otherwise re-apply the default preset the moment the URL runs out of params.
export const FILTER_PRESET_NONE = 'none'

const stateFilter = z.enum(ContentState).optional()

// `.min(1)` so an empty value (`?category=`, the "Vše" option) is dropped
// instead of being kept as an empty string.
const slugFilter = z.string().min(1).optional()

// Roles are seeded, never created at runtime, so the filter can be validated
// against the enum itself — which keeps a stale value out of the URL the same
// way `state` does, without a data-driven staleness check.
const userRoleFilter = z.enum(UserRoleName).optional()
const authorRoleFilter = z.enum(AuthorRoleName).optional()

const contentStateOnly = z.object({ state: stateFilter })

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
  authors: z.object({ role: authorRoleFilter }),
  podcast_episodes: contentStateOnly,
  podcasts: contentStateOnly,
  users: z.object({ role: userRoleFilter }),
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
 * Validates a stored or submitted saved-filter query against the table's schema.
 * Rejects a snapshot that carries nothing usable, so an empty filter is never saved
 * and a stored string is never applied without being re-checked.
 *
 * @param query - A search string, with or without the leading `?`.
 * @param tableKey - Which admin table's schema to validate against.
 * @returns The canonical query string, or `null` when nothing valid remains.
 */
export const validateFilterQuery = (
  query: string,
  tableKey: AdminListTableKey,
): string | null => {
  // SQLite stores enums as plain TEXT with no CHECK constraint, so a row written
  // before a table key was retired can still hand us an unknown key. `hasOwn`
  // rather than `in`, which would also accept prototype keys like `constructor`
  // and then blow up on the missing schema.
  if (!Object.hasOwn(ADMIN_LIST_FILTER_SCHEMAS, tableKey)) {
    return null
  }

  const search = extractAdminListFilterSearch(query, tableKey)

  return search === '' ? null : search
}

/**
 * Tells whether the URL already carries any state of the list — a table filter, the
 * search term, the sort, the page, or the preset marker. Used to decide whether a
 * visit is "bare" enough for the default preset to apply: any explicit param means
 * the user (or a shared link) asked for something specific, which always wins.
 *
 * @param searchParams - The current URL search params.
 * @param tableKey - Which admin table's filter params count as list state.
 * @returns `true` when at least one list param is present.
 */
export const hasAdminListParams = (
  searchParams: URLSearchParams,
  tableKey: AdminListTableKey,
): boolean => {
  const listParams = [
    ...getFilterKeys(tableKey),
    FILTER_PRESET_PARAM,
    ORDER_PARAM,
    PAGE_PARAM,
    SEARCH_PARAM,
    SORT_PARAM,
  ]

  return listParams.some((param) => searchParams.has(param))
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

  // Editing a select means the list no longer matches the preset it came from, so
  // the marker degrades to "explicitly unfiltered" instead of falsely highlighting
  // that preset — and, once every select is cleared, instead of leaving a bare URL
  // that the default-filter redirect would immediately fill back in. Only rewritten
  // when already present, so tables the user has no preset for keep clean URLs.
  if (preserved.has(FILTER_PRESET_PARAM)) {
    preserved.set(FILTER_PRESET_PARAM, FILTER_PRESET_NONE)
  }

  return [...preserved.entries()]
}
