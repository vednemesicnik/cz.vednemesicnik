import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

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

  const rawTags = await prisma.articleTag.findMany({
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

  // Compute permissions for each category
  const tags = rawTags.map((tag) => {
    return {
      ...tag,
      canDelete: context.can({
        action: 'delete',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorId: tag.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorId: tag.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'article_tag',
        state: tag.state,
        targetAuthorId: tag.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'article_tag',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    tags,
  }
}
