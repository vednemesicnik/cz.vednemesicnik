import type { Prisma } from '@generated/prisma/client'

import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const PAGE_SIZE = 20

const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.ArticleOrderByWithRelationInput
> = {
  createdAt: (order) => ({ createdAt: order }),
  title: (order) => ({ title: order }),
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['article'],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'article',
    state: 'archived',
  })

  const { order, page, q, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'createdAt',
    sortKeys: SORT_KEYS,
  })

  // States the current role may view, scoped to own content where access is `own`.
  const viewableStates = buildViewableStateFilters(
    [
      { rights: draftPerms, state: 'draft' },
      { rights: publishedPerms, state: 'published' },
      { rights: archivedPerms, state: 'archived' },
    ],
    { authors: { some: { id: context.authorId } } },
  )

  // Shared by findMany and count. `state` filter (?state=) is a documented
  // follow-up; the AND composition already leaves room for it.
  const permissionWhere = { OR: viewableStates }
  const where = {
    AND: [permissionWhere, ...(q === '' ? [] : [{ title: { contains: q } }])],
  }

  const [rawArticles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        authors: { select: { id: true } },
        createdAt: true,
        id: true,
        state: true,
        title: true,
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    prisma.article.count({ where }),
  ])

  // Compute permissions for each article
  const articles = rawArticles.map((article) => {
    if (article.authors.length === 0) {
      return {
        ...article,
        canDelete: false,
        canEdit: false,
        canView: false,
      }
    }

    const targetAuthorIds = article.authors.map((a) => a.id)

    return {
      ...article,
      canDelete: context.can({
        action: 'delete',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article',
        state: article.state,
        targetAuthorIds,
      }).hasPermission,
    }
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return {
    articles,
    canCreate: context.can({
      action: 'create',
      entity: 'article',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    currentPage: page,
    pageSize: PAGE_SIZE,
    q,
    totalCount,
    totalPages,
  }
}
