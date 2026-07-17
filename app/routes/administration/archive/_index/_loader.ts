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
  (order: SortOrder) => Prisma.IssueOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  label: (order) => [{ label: order }, { createdAt: 'desc' }],
}

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
      ...(query === '' ? [] : [{ label: { contains: query } }]),
    ],
  }

  const rawIssues = await prisma.issue.findMany({
    orderBy: ORDER_BY[sort](order),
    select: {
      authorId: true,
      createdAt: true,
      id: true,
      label: true,
      state: true,
    },
    where,
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
    query,
  }
}
