import { data, href, redirect } from 'react-router'

import { readAdminNotice } from '~/utils/admin-notice/read-admin-notice.server'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import {
  issueTitleSelect,
  resolveIssueTitles,
} from '~/utils/issue/resolve-issue-titles.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getContentActionFlags } from '~/utils/permissions/author/get-content-action-flags.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

import { formatEditHoldLine } from '../../../articles/utils/format-edit-hold-line'
import { getArticleFactLine } from '../../../articles/utils/get-article-fact-line'
import { getArticleHold } from '../../../articles/utils/get-article-hold'
import { getHeldActionFlags } from '../../../articles/utils/get-held-action-flags'
import { buildIssuePermissionWhere } from '../../utils/build-issue-permission-where'
import { getIssueHeaderActions } from '../../utils/get-issue-header-actions'
import { getIssueSupplementLinks } from '../../utils/get-issue-supplement-links.server'
import type { Route } from './+types/route'
import { getMissingIssueContent } from './utils/get-missing-issue-content'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { issueId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: [
      'view',
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

  const issue = await prisma.issue.findUniqueOrThrow({
    select: {
      author: {
        select: {
          id: true,
          name: true,
          role: {
            select: {
              level: true,
            },
          },
        },
      },
      cover: {
        select: imageSourceSelect,
      },
      createdAt: true,
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      id: true,
      ...issueTitleSelect,
      pdf: {
        select: {
          fileName: true,
          originalFileName: true,
          uploadedAt: true,
        },
      },
      publishedAt: true,
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
      updatedAt: true,
    },
    where: { id: issueId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // An empty draft has no detail yet (decision 0020): its editor is the page.
  if (issue.firstContentAt === null) {
    throw redirect(
      href('/administration/archive/:issueId/edit-issue', { issueId }),
    )
  }

  const now = new Date()
  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(issue, { authorId: context.authorId, now })
  const isHeldByOther = hold !== null && !hold.isOwn

  // While someone else edits it, its edit and state actions wait (07g, 26i);
  // the transitions check it again in their own writes.
  const flags = getHeldActionFlags(
    getContentActionFlags(context, 'issue', {
      authors: [issue.author],
      reviews: issue.reviews,
      state: issue.state,
      submittedAt: issue.submittedAt,
    }),
    { isApprover, isHeldByOther },
  )

  const visibleWhere = buildIssuePermissionWhere(context)

  const [[{ title }], supplementLinks, history] = await Promise.all([
    resolveIssueTitles([issue], visibleWhere),
    getIssueSupplementLinks(issue, visibleWhere),
    getContentHistory({
      createdAt: issue.createdAt,
      entity: 'issue',
      entityId: issue.id,
      publishedAt: issue.publishedAt,
    }),
  ])

  const submission = flags.submission?.state ?? null

  // Publishing an incomplete issue opens the 26e sentence instead of the
  // confirmation; only the Coordinator publishes, and the server checks again.
  const missingBeforePublish = isApprover
    ? getMissingIssueContent({
        hasCover: issue.cover !== null,
        order: issue.order,
        pdf: issue.pdf,
        year: issue.year,
      })
    : []

  // Read only here: an earlier redirect must not use up the toast (26i).
  const notice = await readAdminNotice(request)

  return data(
    {
      headerActions: getIssueHeaderActions({
        ...flags,
        isHeldByOther,
        state: issue.state,
        submission,
      }),
      // „Číslo právě upravuje …“ in place of the buttons (26i), and when the page
      // looks again: an expiry sends no event.
      heldByName: isHeldByOther ? hold.heldByName : null,
      heldUntil: hold?.heldUntil.toISOString() ?? null,
      isApprover,
      // One's own editor in another tab: Smazat… waits and says so (23g, 0036).
      isHeldInOwnTab: hold?.isOwn === true,
      isOwnContent: flags.isOwnContent,
      issue: {
        authorName: issue.author.name,
        cover:
          issue.cover === null
            ? null
            : {
                altText: issue.cover.altText,
                sources: createImageSources('issue-cover', issue.cover),
              },
        // Who edits it while held (26i, as 23g).
        factLine:
          hold === null
            ? getArticleFactLine({
                now,
                publishedAt: issue.publishedAt,
                state: issue.state,
                submission: flags.submission,
                updatedAt: issue.updatedAt,
              })
            : formatEditHoldLine({
                holderName: hold.heldByName,
                isOwn: hold.isOwn,
                now,
                since: hold.heldSince,
              }),
        history,
        id: issue.id,
        // Signed in, the web shows a draft only with both files (26b), the
        // PDF under its name (decision 0033).
        isPreviewable:
          issue.state === 'draft' &&
          issue.cover !== null &&
          issue.pdf?.fileName != null,
        name: issue.name,
        orderLabel: getIssueOrderLabel(issue),
        pdf:
          issue.pdf === null
            ? null
            : {
                fileName: issue.pdf.fileName,
                originalFileName: issue.pdf.originalFileName,
                // Without its name, before the year and order, it has no
                // address yet (decision 0033).
                path:
                  issue.pdf.fileName === null
                    ? null
                    : href('/archive/:fileName', {
                        fileName: issue.pdf.fileName,
                      }),
                uploadedAt: {
                  formatted: formatNumericDate(issue.pdf.uploadedAt),
                  iso: issue.pdf.uploadedAt.toISOString(),
                },
              },
        state: issue.state,
        title,
      },
      missingBeforePublish,
      submission,
      supplementLinks,
      // „Číslo právě upravuje …“ after a direct address of its editor (26i).
      toast: notice.toast,
    },
    notice.toast === null
      ? undefined
      : { headers: { 'Set-Cookie': notice.setCookie } },
  )
}
