import type { Prisma } from '@generated/prisma/client'

import {
  extractAdminListFilterSearch,
  FILTER_PRESET_PARAM,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const TABLE_KEY = 'archive'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.IssueOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  label: (order) => [{ label: order }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['issue'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'issue',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'issue',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'issue',
    state: 'archived',
  })

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere = {
    OR: buildViewableStateFilters(
      [
        { rights: draftPerms, state: 'draft' },
        { rights: publishedPerms, state: 'published' },
        { rights: archivedPerms, state: 'archived' },
      ],
      { authorId: context.authorId },
    ),
  }

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The field filter is ANDed with
  // the permission clause, so it only ever narrows what the role may view.
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ label: { contains: query } }]),
      ...(filters.state === undefined ? [] : [{ state: filters.state }]),
    ],
  }

  const [rawIssues, ownFilters, rawSharedFilters] = await Promise.all([
    prisma.issue.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        authorId: true,
        createdAt: true,
        id: true,
        label: true,
        state: true,
      },
      where,
    }),
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        isDefault: true,
        isShared: true,
        name: true,
        query: true,
      },
      where: { tableKey: TABLE_KEY, userId: context.userId },
    }),
    // Someone else's shared presets: apply-only, and labelled with their owner —
    // the unique index is per user, so two people can publish the same name.
    prisma.filter.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        query: true,
        user: { select: { name: true, username: true } },
      },
      where: {
        isShared: true,
        NOT: { userId: context.userId },
        tableKey: TABLE_KEY,
      },
    }),
  ])

  // `User.name` is optional; the username is unique and always set, so it keeps the
  // owner label unambiguous when two people share a preset of the same name.
  const sharedFilters = rawSharedFilters.map((filter) => ({
    id: filter.id,
    name: filter.name,
    ownerName: filter.user.name ?? filter.user.username,
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

  // Compute permissions for each issue
  const issues = rawIssues.map((issue) => {
    return {
      ...issue,
      canDelete: context.can({
        action: 'delete',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
    }
  })

  return {
    activeFilterId,
    canCreate: context.can({
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    // Canonical snapshot of what the selects currently hold — what a save or an
    // overwrite stores, and what tells the menu there is anything worth saving.
    currentFilterQuery: extractAdminListFilterSearch(url.search, TABLE_KEY),
    filters,
    issues,
    ownFilters,
    query,
    sharedFilters,
  }
}
