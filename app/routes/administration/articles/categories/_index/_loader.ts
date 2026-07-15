import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

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

  const rawCategories = await prisma.articleCategory.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      authorId: true,
      id: true,
      name: true,
      state: true,
    },
    where: {
      OR: buildViewableStateFilters(
        [
          { rights: draftPerms, state: 'draft' },
          { rights: publishedPerms, state: 'published' },
          { rights: archivedPerms, state: 'archived' },
        ],
        { authorId: context.authorId },
      ),
    },
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
  }
}
