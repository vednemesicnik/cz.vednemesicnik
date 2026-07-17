import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.ArticleTagOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  name: (order) => ({ name: order }),
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['article_tag'],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'article_tag',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'article_tag',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'article_tag',
    state: 'archived',
  })

  const { order, q, sort } = parseAdminListParams(request, {
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
    AND: [permissionWhere, ...(q === '' ? [] : [{ name: { contains: q } }])],
  }

  const rawTags = await prisma.articleTag.findMany({
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

  // Compute permissions for each tag
  const tags = rawTags.map((tag) => {
    return {
      ...tag,
      canDelete: context.can({
        action: 'delete',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorIds: [tag.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorIds: [tag.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorIds: [tag.authorId],
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'article_tag',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    q,
    tags,
  }
}
