import { PAGE_PARAM } from '~/components/pagination'
import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

const PAGE_SIZE = 20

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

  const url = new URL(request.url)
  const currentPage = Math.max(
    1,
    Number(url.searchParams.get(PAGE_PARAM) ?? '1') || 1,
  )

  // States the current role may view, scoped to own content where access is `own`.
  const viewableStates = buildViewableStateFilters(
    [
      { rights: draftPerms, state: 'draft' },
      { rights: publishedPerms, state: 'published' },
      { rights: archivedPerms, state: 'archived' },
    ],
    { authors: { some: { id: context.authorId } } },
  )

  const [rawArticles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        authors: { select: { id: true } },
        id: true,
        state: true,
        title: true,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where: { OR: viewableStates },
    }),
    prisma.article.count({
      where: { OR: viewableStates },
    }),
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
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
