import {
  AuthorRoleName,
  ContentState,
  type FilterTable,
  UserRoleName,
} from '@generated/prisma/enums'
import { z } from 'zod'

import { PAGE_PARAM } from '~/components/pagination'
import { ARTICLE_QUEUES } from '~/config/article-queue-config'
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

// `.min(1)` so an empty value (`?category=`, the "Všechny" option) is dropped
// instead of being kept as an empty string.
const slugValue = z.string().min(1)

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
  // Every filter takes several values (design 22d): repeated params, any of.
  articles: z.object({
    author: z.array(slugValue).optional(),
    category: z.array(slugValue).optional(),
    // The queues (design 22a), not the data states: a draft is an unsubmitted one.
    state: z.array(z.enum(ARTICLE_QUEUES)).optional(),
    tag: z.array(slugValue).optional(),
  }),
  authors: z.object({ role: authorRoleFilter }),
  podcast_episodes: contentStateOnly,
  podcasts: contentStateOnly,
  users: z.object({ role: userRoleFilter }),
} satisfies Record<AdminListTableKey, z.ZodObject>

// Tables whose saved filter stores the search as well (design 22d). The search
// stays out of the schema: it is not a filter, and a filter submit preserves it.
const SAVED_FILTER_SEARCH_TABLES: ReadonlySet<AdminListTableKey> = new Set([
  'articles',
])

const getFilterKeys = (tableKey: AdminListTableKey): string[] =>
  Object.keys(ADMIN_LIST_FILTER_SCHEMAS[tableKey].shape)

type FilterValue = string | string[]

// The element schema of a multi-value filter, `null` for a single-value one.
const getElementSchema = (fieldSchema: z.ZodType): z.ZodType | null => {
  // The registry builds every schema with classic Zod, so its parts are too.
  const innerSchema =
    fieldSchema instanceof z.ZodOptional
      ? (fieldSchema.unwrap() as z.ZodType)
      : fieldSchema

  return innerSchema instanceof z.ZodArray
    ? (innerSchema.element as z.ZodType)
    : null
}

// Validates field by field, and a multi-value field value by value, so one bad
// value cannot discard its valid siblings.
const pickValidFilters = (
  searchParams: URLSearchParams,
  tableKey: AdminListTableKey,
): Record<string, FilterValue> => {
  const shape = ADMIN_LIST_FILTER_SCHEMAS[tableKey].shape as Record<
    string,
    z.ZodType
  >

  const values: Record<string, FilterValue> = {}

  for (const [key, fieldSchema] of Object.entries(shape)) {
    const elementSchema = getElementSchema(fieldSchema)

    if (elementSchema !== null) {
      const validValues = [...new Set(searchParams.getAll(key))].filter(
        (value) => elementSchema.safeParse(value).success,
      )

      if (validValues.length > 0) {
        values[key] = validValues
      }

      continue
    }

    const rawValue = searchParams.get(key)

    if (rawValue === null) {
      continue
    }

    const result = fieldSchema.safeParse(rawValue)

    if (result.success && typeof result.data === 'string') {
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
 * for saving and to re-validate stored snapshots. The article list also keeps its
 * search term, trimmed, after the filters.
 *
 * @param search - A search string, with or without the leading `?`.
 * @param tableKey - Which admin table's schema to validate against.
 * @returns The canonical query string without a leading `?`, or `''` when nothing is valid.
 */
export const extractAdminListFilterSearch = (
  search: string,
  tableKey: AdminListTableKey,
): string => {
  const searchParams = new URLSearchParams(search)
  const values = pickValidFilters(searchParams, tableKey)
  const shape = ADMIN_LIST_FILTER_SCHEMAS[tableKey].shape as Record<
    string,
    z.ZodType
  >
  const canonical = new URLSearchParams()

  for (const key of getFilterKeys(tableKey)) {
    const value = values[key]

    if (value === undefined) {
      continue
    }

    if (typeof value === 'string') {
      canonical.set(key, value)
      continue
    }

    // Order-free, so a saved filter matches whatever the click order, and
    // database-free: an enum in its own order, the rest by code point. The
    // list's URL uses the menu order instead (`buildStaleFilterRedirect`).
    const elementSchema = getElementSchema(shape[key])
    const sortedValues =
      elementSchema instanceof z.ZodEnum
        ? elementSchema.options.filter((option) =>
            value.includes(String(option)),
          )
        : [...value].sort()

    for (const sortedValue of sortedValues) {
      canonical.append(key, String(sortedValue))
    }
  }

  const query = (searchParams.get(SEARCH_PARAM) ?? '').trim()

  if (SAVED_FILTER_SEARCH_TABLES.has(tableKey) && query !== '') {
    canonical.set(SEARCH_PARAM, query)
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
 * Builds the redirect target that strips filter values no longer offered — a
 * deleted category, an author that lost its last visible article — one by one,
 * keeping the others. Left in place, such a value keeps narrowing the list while
 * its menu, having no matching option, does not show it. It also puts repeated
 * values in the options' order and drops duplicates, so equal filters give equal
 * URLs (design 22d).
 *
 * @param url - The request's normalized URL (React Router's `url` loader arg).
 * @param optionsByParam - The offered options in menu order, keyed by filter param name.
 * @returns The path to redirect to, or `null` when the URL is already canonical.
 */
export const buildStaleFilterRedirect = (
  url: URL,
  optionsByParam: Record<string, { value: string }[]>,
): string | null => {
  const changedParams = Object.entries(optionsByParam).flatMap(
    ([param, options]) => {
      // An empty value is the "Vše" option, which the parser drops anyway.
      const values = url.searchParams
        .getAll(param)
        .filter((value) => value !== '')
      const canonicalValues = options
        .map((option) => option.value)
        .filter((value) => values.includes(value))
      const isCanonical =
        values.length === canonicalValues.length &&
        values.every((value, index) => value === canonicalValues[index])

      return isCanonical ? [] : [{ canonicalValues, param }]
    },
  )

  if (changedParams.length === 0) {
    return null
  }

  const searchParams = new URLSearchParams(url.searchParams)

  for (const { canonicalValues, param } of changedParams) {
    searchParams.delete(param)

    for (const value of canonicalValues) {
      searchParams.append(param, value)
    }
  }

  // A dropped value widens the result set, so the current page may no longer
  // exist; a reorder alone happens on links that carry no page.
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
