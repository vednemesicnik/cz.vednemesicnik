import {
  type AdminListTableKey,
  extractAdminListFilterSearch,
  FILTER_PRESET_PARAM,
  validateFilterQuery,
} from '~/utils/admin-list-filters'
import { prisma } from '~/utils/db.server'

type LoadSavedFiltersOptions = {
  tableKey: AdminListTableKey
  url: URL
  userId: string
}

/**
 * Loads everything the saved-filters menu of one admin list needs.
 *
 * Awaits its two queries in parallel, so a list loader can run it as a single
 * branch of its own `Promise.all` alongside the row query.
 *
 * @param options - `tableKey` of the list, its normalized `url`, and the viewer's `userId`.
 * @returns `ownFilters` — the viewer's presets, editable; `sharedFilters` — everyone
 *   else's shared ones, apply-only and labelled with their owner; `activeFilterId` —
 *   the preset the current URL came from, `null` when it points at nothing the viewer
 *   can see; `currentFilterQuery` — the canonical snapshot a save or overwrite stores;
 *   `matchingFilterId` — the preset whose filters equal the current ones exactly,
 *   whatever the order of their values (design 22d), `null` when none does.
 */
export const loadSavedFilters = async ({
  tableKey,
  url,
  userId,
}: LoadSavedFiltersOptions) => {
  const [ownFilters, rawSharedFilters] = await Promise.all([
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        isDefault: true,
        isShared: true,
        name: true,
        query: true,
      },
      where: { tableKey, userId },
    }),
    // Someone else's shared presets: apply-only, and labelled with their owner —
    // the unique index is per user, so two people can publish the same name.
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        query: true,
        user: {
          select: { author: { select: { name: true } }, username: true },
        },
      },
      where: { isShared: true, NOT: { userId }, tableKey },
    }),
  ])

  // The name belongs to the author (design 28f); an empty one falls back to the
  // username, which is unique and always set.
  const sharedFilters = rawSharedFilters.map((filter) => ({
    id: filter.id,
    name: filter.name,
    ownerName: filter.user.author.name || filter.user.username,
    query: filter.query,
  }))

  // A preset the viewer cannot see (deleted, unshared, or someone else's private one)
  // leaves the menu unhighlighted instead of pointing at nothing.
  const requestedFilterId = url.searchParams.get(FILTER_PRESET_PARAM)
  const activeFilterId =
    requestedFilterId !== null &&
    [...ownFilters, ...sharedFilters].some(
      (filter) => filter.id === requestedFilterId,
    )
      ? requestedFilterId
      : null

  const currentFilterQuery = extractAdminListFilterSearch(url.search, tableKey)

  // Compared as canonical snapshots, so the order of the values never matters.
  // The preset the URL came from wins a tie, then own presets before shared ones.
  const matchingFilters =
    currentFilterQuery === ''
      ? []
      : [...ownFilters, ...sharedFilters].filter(
          (filter) =>
            validateFilterQuery(filter.query, tableKey) === currentFilterQuery,
        )
  const matchingFilterId =
    matchingFilters.find((filter) => filter.id === activeFilterId)?.id ??
    matchingFilters[0]?.id ??
    null

  return {
    activeFilterId,
    currentFilterQuery,
    matchingFilterId,
    ownFilters,
    sharedFilters,
  }
}
