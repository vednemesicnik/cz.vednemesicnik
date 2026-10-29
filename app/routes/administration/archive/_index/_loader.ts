import type { Prisma } from '@generated/prisma/client'
import { data, redirect } from 'react-router'

import {
  CONTRIBUTOR_STATE_FILTER_QUEUES,
  STATE_FILTER_QUEUES,
} from '~/config/content-queue-config'
import {
  buildStaleFilterRedirect,
  parseAdminListFilters,
} from '~/utils/admin-list-filters'
import { parseAdminListParams, type SortOrder } from '~/utils/admin-list-params'
import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'
import { buildContentQueueWhere } from '~/utils/build-content-queue-where'
import { buildLastPageRedirect } from '~/utils/build-last-page-redirect'
import { countContentQueues } from '~/utils/count-content-queues.server'
import { prisma } from '~/utils/db.server'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { NON_EMPTY_ISSUE_WHERE } from '~/utils/issue/non-empty-issue-where'
import { resolveIssueTitles } from '~/utils/issue/resolve-issue-titles.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { buildIssuePermissionWhere } from '../utils/build-issue-permission-where'
import { findTakenIssueIds } from '../utils/find-taken-issue-ids.server'
import { getIssueRow } from '../utils/get-issue-row.server'
import { ISSUE_ROW_SELECT } from '../utils/issue-row-select'
import type { Route } from './+types/route'
import { SORT_KEYS, type SortKey } from './sort'

const PAGE_SIZE = 20

const TABLE_KEY = 'archive'

// `createdAt desc` breaks ties so rows with equal values keep a deterministic
// order across reloads.
const ORDER_BY: Record<
  SortKey,
  (order: SortOrder) => Prisma.IssueOrderByWithRelationInput[]
> = {
  // A supplement stays right under its issue whichever way, and a draft without
  // its year or order stands first (design 26a).
  order: (order) => [
    { year: { nulls: 'first', sort: order } },
    { order: { nulls: 'first', sort: order } },
    { supplementSlug: 'asc' },
    { createdAt: 'desc' },
  ],
}

export const loader = async ({ request, url }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
      'create',
      'update',
      'delete',
      'publish',
      'retract',
      'archive',
      'restore',
      'review',
    ],
    entities: ['issue'],
  })

  // Before any query: a bare visit with a default preset never renders this list,
  // it redirects to the preset's own URL.
  await resolveDefaultFilter({
    tableKey: TABLE_KEY,
    url,
    userId: context.userId,
  })

  const { order, page, query, sort } = parseAdminListParams(request, {
    defaultOrder: 'desc',
    defaultSort: 'order',
    sortKeys: SORT_KEYS,
  })

  const filters = parseAdminListFilters(request, TABLE_KEY)

  const permissionWhere = buildIssuePermissionWhere(context)

  // The years an issue is in (26a), offered whether or not the role may view
  // them, so a shared link means the same for everyone, as the article list's
  // options do. A draft without a year adds none (log 0034).
  const yearOptions = (
    await prisma.issue.findMany({
      distinct: ['year'],
      orderBy: { year: 'desc' },
      select: { year: true },
      where: { ...NON_EMPTY_ISSUE_WHERE, year: { not: null } },
    })
  ).map(({ year }) => ({ label: String(year), value: String(year) }))

  // SQLite `contains` is case-insensitive for ASCII only; Czech diacritics
  // match case-sensitively (accepted limitation). The field filters are ANDed
  // with the permission clause, so they only ever narrow what the role may view.
  const where = {
    AND: [
      permissionWhere,
      ...(query === ''
        ? []
        : [
            {
              OR: [
                { name: { contains: query } },
                { supplement: { contains: query } },
              ],
            },
          ]),
      ...(filters.state === undefined
        ? []
        : [{ OR: filters.state.map(buildContentQueueWhere) }]),
      ...(filters.year === undefined
        ? []
        : [{ year: { in: filters.year.map(Number) } }]),
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

  const [rawIssues, totalCount, savedFilters, queueCounts] = await Promise.all([
    prisma.issue.findMany({
      orderBy: ORDER_BY[sort](order),
      select: ISSUE_ROW_SELECT,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      where,
    }),
    prisma.issue.count({ where }),
    loadSavedFilters({ tableKey: TABLE_KEY, url, userId: context.userId }),
    // The Stav menu counts work within what the role may view, whatever else
    // is searched or filtered (22d).
    countContentQueues(isContributor, (queue) =>
      prisma.issue.count({
        where: { AND: [permissionWhere, buildContentQueueWhere(queue)] },
      }),
    ),
  ])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Deleting the last row on the last page revalidates a URL past the end.
  if (isPagePastLast(page, totalPages)) {
    throw redirect(buildLastPageRedirect(url, totalPages))
  }

  const [titledIssues, takenIds] = await Promise.all([
    resolveIssueTitles(rawIssues, permissionWhere),
    // Numbers another issue holds as published (log 0039).
    findTakenIssueIds(rawIssues),
  ])

  const now = new Date()
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL

  const issues = titledIssues.map((issue) =>
    getIssueRow(issue, { context, isNumberTaken: takenIds.has(issue.id), now }),
  )

  // Read only here: an earlier redirect must not use up the toast (26i).
  const notice = await readAdminNotice(request)

  return data(
    {
      ...savedFilters,
      canCreate: context.can({
        action: 'create',
        entity: 'issue',
        state: 'draft',
        targetAuthorIds: [context.authorId],
      }).hasPermission,
      currentPage: page,
      filters,
      isApprover,
      isContributor,
      issues,
      pageSize: PAGE_SIZE,
      query,
      queueCounts,
      // „Číslo právě upravuje …“ after the editor of a held new draft (26i).
      toast: notice.toast,
      totalCount,
      totalPages,
      yearOptions,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}
