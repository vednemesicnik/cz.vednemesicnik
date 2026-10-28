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
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { isPagePastLast } from '~/utils/is-page-past-last'
import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import { NON_EMPTY_ISSUE_WHERE } from '~/utils/issue/non-empty-issue-where'
import {
  issueTitleSelect,
  resolveIssueTitles,
} from '~/utils/issue/resolve-issue-titles.server'
import { loadSavedFilters } from '~/utils/load-saved-filters.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { resolveDefaultFilter } from '~/utils/resolve-default-filter.server'

import { formatEditHoldLine } from '../../articles/utils/format-edit-hold-line'
import { getArticleHold } from '../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../articles/utils/get-held-action-flags'
import { getMissingIssueContent } from '../issue/_index/utils/get-missing-issue-content'
import { buildIssuePermissionWhere } from '../utils/build-issue-permission-where'
import { findTakenIssueIds } from '../utils/find-taken-issue-ids.server'
import { getIssueFactLine } from '../utils/get-issue-fact-line'
import { getIssueRowActions } from '../utils/get-issue-row-actions'
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
      select: {
        author: {
          select: { id: true, name: true, role: { select: { level: true } } },
        },
        cover: { select: imageSourceSelect },
        heldByAuthor: { select: { name: true } },
        heldByAuthorId: true,
        heldByTabId: true,
        heldSince: true,
        heldUntil: true,
        id: true,
        ...issueTitleSelect,
        pdf: { select: { fileName: true, originalFileName: true } },
        reviews: {
          select: {
            createdAt: true,
            reviewer: {
              select: { id: true, role: { select: { level: true } } },
            },
          },
        },
        state: true,
        submittedAt: true,
        submittedBy: { select: { name: true } },
        supplementSlug: true,
        updatedAt: true,
      },
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

  const issues = titledIssues.map((issue) => {
    const hold = getArticleHold(issue, { authorId: context.authorId, now })
    const isHeldByOther = hold !== null && !hold.isOwn
    // While someone else edits it, its edit and state actions wait; the
    // Coordinator's Upravit opens the takeover (26i, 26k).
    const flags = getHeldActionFlags(
      getContentActionFlags(context, 'issue', {
        authors: [issue.author],
        reviews: issue.reviews,
        state: issue.state,
        submittedAt: issue.submittedAt,
      }),
      { isApprover, isHeldByOther },
    )
    const submission = flags.submission?.state ?? null

    return {
      ...getIssueRowActions({
        ...flags,
        canEdit: flags.canEdit || flags.canTakeOver,
        state: issue.state,
        submission,
      }),
      canDelete: flags.canDelete,
      cover:
        issue.cover === null
          ? null
          : createImageSources('issue-cover', issue.cover),
      // The row's tag says what the detail's does (07a), with one fact (26a).
      factLine: getIssueFactLine({
        authorName: issue.author.name,
        state: issue.state,
        submission: flags.submission,
        submittedByName: issue.submittedBy?.name ?? null,
        updatedAt: issue.updatedAt,
      }),
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      // Who edits it, ahead of the fact (26i, as 22f); the list looks again
      // when it should expire.
      holdLine:
        hold === null
          ? null
          : formatEditHoldLine({
              holderName: hold.heldByName,
              isOwn: hold.isOwn,
              now,
            }),
      id: issue.id,
      // Publishing it, the dialog says it isn't submitted (26h).
      isNotSubmitted:
        issue.state === 'draft' &&
        flags.submission === null &&
        flags.isSubmittable &&
        !flags.isOwnContent,
      // Publishing an incomplete issue opens the 26e sentence instead of the
      // confirmation; only the Coordinator publishes, and the server checks again.
      missingBeforePublish: isApprover
        ? getMissingIssueContent({
            hasCover: issue.cover !== null,
            hasPdf: issue.pdf !== null,
            isNumberTaken: takenIds.has(issue.id),
            order: issue.order,
            supplement: issue.supplement,
            year: issue.year,
          })
        : [],
      orderLabel: getIssueOrderLabel(issue),
      // The name the reader downloads it under; before publish it has none,
      // so the uploaded one, as on the detail (26b, log 0039).
      pdfFileName: issue.pdf?.fileName ?? issue.pdf?.originalFileName ?? null,
      state: issue.state,
      submission,
      supplement: issue.supplement || null,
      title: issue.title,
      year: issue.year,
    }
  })

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
