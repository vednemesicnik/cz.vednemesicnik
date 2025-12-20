import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['issue'],
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

  const rawIssues = await prisma.issue.findMany({
    orderBy: {
      releasedAt: 'desc',
    },
    select: {
      authorId: true,
      id: true,
      label: true,
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

  // Compute permissions for each issue
  const issues = rawIssues.map((issue) => {
    return {
      ...issue,
      canDelete: context.can({
        action: 'delete',
        entity: 'issue',
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'issue',
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'issue',
        state: issue.state,
        targetAuthorId: issue.authorId,
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorId: context.authorId,
    }).hasPermission,
    issues,
  }
}
