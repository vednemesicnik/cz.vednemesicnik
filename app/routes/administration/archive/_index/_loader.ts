import type { Prisma } from '@generated/prisma/client'
import { redirect } from 'react-router'

import {
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import { getIssueYear } from '~/utils/get-issue-year'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { buildViewableStateFilters } from '~/utils/permissions/author/build-viewable-state-filters'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const TABLE_KEY = 'archive'

// Non-createdAt sorts append `createdAt desc` as a tie-breaker so rows with
// equal values keep a deterministic order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.IssueOrderByWithRelationInput[]
> = {
  createdAt: (order) => [{ createdAt: order }],
  label: (order) => [{ label: order }, { createdAt: 'desc' }],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'create', 'update', 'delete'],
    entities: ['issue'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
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

  const filters = parseAdminListFilters(request, TABLE_KEY)

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

  // The years an issue is in (26a), offered whether or not the role may view
  // them, so a shared link means the same for everyone, as the article list's
  // options do. An issue has no year of its own yet: it is its release's.
  const issueYears = (
    await prisma.issue.findMany({ select: { id: true, releasedAt: true } })
  ).map((issue) => ({ id: issue.id, year: getIssueYear(issue.releasedAt) }))
  const yearOptions = [...new Set(issueYears.map((issue) => issue.year))]
    .sort((first, second) => second.localeCompare(first))
    .map((year) => ({ label: year, value: year }))

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The field filters are ANDed
  // with the permission clause, so they only ever narrow what the role may view.
  const where = {
    AND: [
      permissionWhere,
      ...(query === '' ? [] : [{ label: { contains: query } }]),
      ...(filters.state === undefined
        ? []
        : [{ OR: filters.state.map(buildContentQueueWhere) }]),
      ...(filters.year === undefined
        ? []
        : [
            {
              id: {
                in: issueYears
                  .filter((issue) => filters.year?.includes(issue.year))
                  .map((issue) => issue.id),
              },
            },
          ]),
    ],
  }

  // A Contributor approves nothing: Odeslané instead of Ke schválení and
  // Schválené (22i).
  const isContributor = context.roleName === 'contributor'

  // A year with no issue left, or a state the role's menu does not offer (a
  // Coordinator's link opened by a Contributor), drops, or it would filter
  // unseen.
  const staleFilterRedirect = buildStaleFilterRedirect(url, {
    state: (isContributor
      ? CONTRIBUTOR_STATE_FILTER_QUEUES
      : STATE_FILTER_QUEUES
    ).map((queue) => ({ value: queue })),
    year: yearOptions,
  })

  if (staleFilterRedirect !== null) {
    throw redirect(staleFilterRedirect)
  }

  const [rawIssues, savedFilters, queueCounts] = await Promise.all([
    prisma.issue.findMany({
      orderBy: ORDER_BY[sort](order),
      select: {
        authorId: true,
        createdAt: true,
        id: true,
        label: true,
        reviews: {
          select: {
            createdAt: true,
            reviewer: { select: { role: { select: { level: true } } } },
          },
        },
        state: true,
        submittedAt: true,
      },
      where,
    }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
    // The Stav menu counts work within what the role may view, whatever else
    // is searched or filtered (22d).
    countContentQueues(isContributor, (queue) =>
      prisma.issue.count({
        where: { AND: [permissionWhere, buildContentQueueWhere(queue)] },
      }),
    ),
  ])

  // Compute permissions for each issue
  const issues = rawIssues.map(({ reviews, ...issue }) => {
    return {
      ...issue,
      // A submitted draft is neither deleted nor edited by its author (07d).
      canDelete:
        context.can({
          action: 'delete',
          entity: 'issue',
          state: issue.state,
          targetAuthorIds: [issue.authorId],
        }).hasPermission && issue.submittedAt === null,
      canEdit:
        context.can({
          action: 'update',
          entity: 'issue',
          state: issue.state,
          targetAuthorIds: [issue.authorId],
        }).hasPermission &&
        !isLockedBySubmission({
          roleLevel: context.roleLevel,
          submittedAt: issue.submittedAt,
        }),
      canView: context.can({
        action: 'view',
        entity: 'issue',
        state: issue.state,
        targetAuthorIds: [issue.authorId],
      }).hasPermission,
      // The row's tag says what the detail's does (07a).
      submission: getSubmissionState({ ...issue, reviews })?.state ?? null,
    }
  })

  return {
    ...savedFilters,
    canCreate: context.can({
      action: 'create',
      entity: 'issue',
      state: 'draft',
      targetAuthorIds: [context.authorId],
    }).hasPermission,
    filters,
    isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
    isContributor,
    issues,
    query,
    queueCounts,
    yearOptions,
  }
}
