import { prisma } from '~/utils/db.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
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
      OR: buildViewableStateFilters(
        [
          { state: 'draft', rights: draftPerms },
          { state: 'published', rights: publishedPerms },
          { state: 'archived', rights: archivedPerms },
        ],
        { authorId: context.authorId },
      ),
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
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
      canEdit: context.can({
        action: 'update',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
      canView: context.can({
        action: 'view',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
    }
  })

  return {
    canCreate: context.can({
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    issues,
  }
}
