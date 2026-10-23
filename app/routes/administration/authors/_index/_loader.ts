import type { Prisma } from '@generated/prisma/client'
import { data, redirect } from 'react-router'

import {
  ACCOUNT_OPTIONS,
  AUTHOR_ROLE_OPTIONS,
} from '~/utils/admin-filter-options'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { AUTHOR_REFERENCES_SELECT } from '~/utils/author-references/author-references-select'
import { getAuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import { prisma } from '~/utils/db.server'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getUserPermissionContext } from '~/utils/permissions/user/context/get-user-permission-context.server'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const TABLE_KEY = 'authors'

// Every sort appends the name and then `createdAt desc` as tie-breakers so
// rows with equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.AuthorOrderByWithRelationInput[]
> = {
  account: (order) => [
    { user: { email: order } },
    { name: 'asc' },
    { createdAt: 'desc' },
  ],
  name: (order) => [{ name: order }, { createdAt: 'desc' }],
  role: (order) => [
    { role: { level: order } },
    { name: 'asc' },
    { createdAt: 'desc' },
  ],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getUserPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['author', 'user'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  // Check if user has any view permission for authors
  // We check against own userId to see if they have at least "own" access
  const viewPerms = context.can({
    action: 'view',
    entity: 'author',
    targetUserId: context.userId,
  })

  // If user has no view permissions at all, they shouldn't access this page
  if (!viewPerms.hasPermission) {
    throw data(null, { status: 403 })
  }

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'asc',
    defaultSort: 'name',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  // Repeated values in menu order, duplicates and unknown values dropped, so
  // equal filters give equal URLs (22d).
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    account: ACCOUNT_OPTIONS,
    role: AUTHOR_ROLE_OPTIONS,
  })

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  // If user only has "own" permission, filter to only their author profile.
  const permissionWhere =
    viewPerms.hasOwn && !viewPerms.hasAny
      ? { user: { id: context.userId } }
      : {}

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The filters are ANDed with
  // the permission clause, so they only ever narrow what the viewer may see.
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ name: { contains: query } }]),
      ...(filters.role === undefined
        ? []
        : [{ role: { name: { in: filters.role } } }]),
      // Both values together are everyone, as no value is (28a).
      ...(filters.account?.length === 1
        ? [
            filters.account[0] === 'linked'
              ? { user: { isNot: null } }
              : { user: { is: null } },
          ]
        : []),
    ],
  }

  const [rawAuthors, publishedCounts, savedFilters] = await Promise.all([
    prisma.author.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        ...AUTHOR_REFERENCES_SELECT,
        id: true,
        name: true,
        role: {
          select: {
            id: true,
            level: true,
            name: true,
          },
        },
        user: {
          select: {
            email: true,
            id: true,
            image: { select: imageSourceSelect },
            role: { select: { name: true } },
          },
        },
      },
      where,
    }),
    // Publikováno: the published articles, episodes and issues (28a). A second
    // query, since a select holds one `_count` and the first counts every state.
    prisma.author.findMany({
      select: {
        _count: {
          select: {
            articles: { where: { state: 'published' } },
            issues: { where: { state: 'published' } },
            podcastEpisodes: { where: { state: 'published' } },
          },
        },
        id: true,
      },
      where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
  ])

  const publishedCountById = new Map(
    publishedCounts.map(({ _count, id }) => [
      id,
      _count.articles + _count.issues + _count.podcastEpisodes,
    ]),
  )

  // Založit účet… opens the new user with the author chosen (28a, 28f).
  const canCreateUser = context.can({
    action: 'create',
    entity: 'user',
    targetUserId: context.userId,
  }).hasPermission

  // Compute permissions for each author
  // targetUserId is the user who owns this author profile (or undefined for external authors)
  const authors = rawAuthors.map(({ _count, user, ...author }) => {
    const targetUserId = user?.id
    const deleteBlock = getAuthorDeleteBlock({ _count, user }, context.userId)
    const mayDelete = context.can({
      action: 'delete',
      entity: 'author',
      targetUserId,
    }).hasPermission

    return {
      ...author,
      canCreateUser: user === null && canCreateUser,
      // Smazat… confirms a deletable author and explains a blocked one (28g);
      // only a deletable author can be selected for the bulk delete (28a).
      canDelete: mayDelete && deleteBlock.deletable,
      canUpdate: context.can({
        action: 'update',
        entity: 'author',
        targetUserId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'author',
        targetUserId,
      }).hasPermission,
      deleteBlock,
      email: user?.email ?? null,
      image: createImageSources('user-image', user?.image),
      // The association is the Owner's author (log 0026).
      isAssociation: user?.role.name === 'owner',
      mayDelete,
      publishedCount: publishedCountById.get(author.id) ?? 0,
    }
  })

  // Create doesn't need targetUserId - it's creating a new author
  const createPerms = context.can({
    action: 'create',
    entity: 'author',
  })

  return {
    ...savedFilters,
    authors,
    canCreate: createPerms.hasAny, // Only "any" access can create new authors
    filters,
    query,
  }
}
