import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.ArticleCategoryOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  name: (order) => [{ name: order }, { createdAt: 'desc' }],
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['article_category'],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'article_category',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'article_category',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'article_category',
    state: 'archived',
  })

  const { order, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

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
  // match case-sensitively (accepted limitation).
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ name: { contains: query } }]),
    ],
  }

  const rawCategories = await prisma.articleCategory.findMany({
    orderBy: ORDER_BY[sort](order),
    select: {
      authorId: true,
      createdAt: true,
      id: true,
      name: true,
      state: true,
    },
    where,
  })

  // Compute permissions for each category
  const categories = rawCategories.map((category) => {
    return {
      ...category,
      canDelete: context.can({
        action: 'delete',
        entity: 'article_category',
        state: category.state,
        targetAuthorIds: [category.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article_category',
        state: category.state,
        targetAuthorIds: [category.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article_category',
        state: category.state,
        targetAuthorIds: [category.authorId],
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'article_category',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    categories,
    query,
  }
}
