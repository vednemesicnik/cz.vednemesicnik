import { PAGE_PARAM } from '~/components/pagination'
import { prisma } from '~/utils/db.server'
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

  const [rawArticles, totalCount] = await Promise.all([
    prisma.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        authorId: true,
        id: true,
        state: true,
        title: true,
      },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where: {
        OR: [
          {
            state: 'draft',
            ...(draftPerms.hasOwn && !draftPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
          {
            state: 'published',
            ...(publishedPerms.hasOwn && !publishedPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
          {
            state: 'archived',
            ...(archivedPerms.hasOwn && !archivedPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
        ],
      },
    }),
    prisma.article.count({
      where: {
        OR: [
          {
            state: 'draft',
            ...(draftPerms.hasOwn && !draftPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
          {
            state: 'published',
            ...(publishedPerms.hasOwn && !publishedPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
          {
            state: 'archived',
            ...(archivedPerms.hasOwn && !archivedPerms.hasAny
              ? { authorId: context.authorId }
              : {}),
          },
        ],
      },
    }),
  ])

  // Compute permissions for each article
  const articles = rawArticles.map((article) => {
    return {
      ...article,
      canDelete: context.can({
        action: 'delete',
        entity: 'article',
        state: article.state,
        targetAuthorId: article.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article',
        state: article.state,
        targetAuthorId: article.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article',
        state: article.state,
        targetAuthorId: article.authorId,
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
      targetAuthorId: context.authorId,
    }).hasPermission,
    currentPage,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  }
}
