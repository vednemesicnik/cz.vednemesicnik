import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['page_seo'],
  })

  // Check view permissions for each state
  const draftPerms = context.can({
    action: 'view',
    entity: 'page_seo',
    state: 'draft',
  })
  const publishedPerms = context.can({
    action: 'view',
    entity: 'page_seo',
    state: 'published',
  })
  const archivedPerms = context.can({
    action: 'view',
    entity: 'page_seo',
    state: 'archived',
  })

  const rawPagesSEO = await prisma.pageSEO.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      authorId: true,
      id: true,
      pathname: true,
      state: true,
    },
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
  })

  // Compute permissions for each page SEO
  const pagesSEO = rawPagesSEO.map((pageSeo) => {
    return {
      ...pageSeo,
      canDelete: context.can({
        action: 'delete',
        entity: 'page_seo',
        state: pageSeo.state,
        targetAuthorId: pageSeo.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'page_seo',
        state: pageSeo.state,
        targetAuthorId: pageSeo.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'page_seo',
        state: pageSeo.state,
        targetAuthorId: pageSeo.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'page_seo',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    pagesSEO,
  }
}
