import { data, href, redirect } from 'react-router'

import { flashAdminNotice } from '~/utils/admin-notice/flash-admin-notice.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { getPragueYear } from '~/utils/get-prague-year'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getIssueTitle } from '~/utils/issue/get-issue-title'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'
import { getSubmissionState } from '~/utils/permissions/author/submission/get-submission-state'
import { isLockedBySubmission } from '~/utils/permissions/author/submission/is-locked-by-submission'

import { canChooseRecordAuthor } from '../../../articles/utils/can-choose-record-author'
import { getArticleHold } from '../../../articles/utils/get-article-hold'
import { findPublishedNumberConflict } from '../../utils/find-published-number-conflict.server'
import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { issueId } = params

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['issue'],
  })

  const issue = await prisma.issue.findUnique({
    select: {
      author: { select: { id: true, name: true } },
      cover: { select: imageSourceSelect },
      firstContentAt: true,
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
      id: true,
      name: true,
      order: true,
      pdf: {
        select: {
          fileName: true,
          id: true,
          originalFileName: true,
          uploadedAt: true,
        },
      },
      publishedNumber: true,
      reviews: {
        select: {
          createdAt: true,
          reviewer: { select: { role: { select: { level: true } } } },
        },
      },
      state: true,
      submittedAt: true,
      supplement: true,
      supplementSlug: true,
      updatedAt: true,
      year: true,
    },
    where: { id: issueId },
  })

  if (issue === null) {
    throw data(null, { status: 404 })
  }

  requireContentUpdatePermission(context, {
    authorIds: [issue.author.id],
    id: issueId,
    kind: 'issue',
    state: issue.state,
    // The denial (30d) names the issue as the list does.
    title: getIssueTitle(issue),
  })

  // A submitted issue is locked for its author until they take it back
  // (design 07d). Design 30d has no reason for it yet, so the generic 403 (30h).
  if (
    isLockedBySubmission({
      roleLevel: context.roleLevel,
      submittedAt: issue.submittedAt,
    })
  ) {
    throw data(null, { status: 403 })
  }

  const isApprover = context.roleLevel <= APPROVER_ROLE_LEVEL
  const hold = getArticleHold(issue, {
    authorId: context.authorId,
    now: new Date(),
  })

  // Someone else edits it: only the Coordinator gets the takeover dialog; the
  // others go to the detail (24g). An empty draft has no detail (0020), so to
  // the list.
  if (hold !== null && !hold.isOwn && !isApprover) {
    throw redirect(
      issue.firstContentAt === null
        ? href('/administration/archive')
        : href('/administration/archive/:issueId', { issueId }),
      {
        headers: {
          'Set-Cookie': await flashAdminNotice(
            request,
            `Číslo právě upravuje ${hold.heldByName}.`,
          ),
        },
      },
    )
  }

  const canChooseAuthor = canChooseRecordAuthor(context.roleLevel)

  const [otherIssues, authors, numberConflict] = await Promise.all([
    // The other issues' numbers: the free order follows them (26c) and a
    // supplement is named after its main issue (wo02u3xq).
    prisma.issue.findMany({
      select: {
        authorId: true,
        firstContentAt: true,
        name: true,
        order: true,
        state: true,
        supplementSlug: true,
        year: true,
      },
      where: {
        id: { not: issueId },
        order: { not: null },
        year: { not: null },
      },
    }),
    // Only the Coordinator chooses the author (26c, as 25c).
    canChooseAuthor
      ? getAuthorsByPermission(context, 'issue', 'update', issue.state)
      : Promise.resolve(null),
    // Another issue holds the number as published: the field says so from
    // the start (26d, log 0039).
    findPublishedNumberConflict({
      issueId,
      order: issue.order,
      supplementSlug: issue.supplementSlug,
      year: issue.year,
    }),
  ])

  const mainIssues = otherIssues.filter((other) => other.supplementSlug === '')
  const takenOrdersByYear: Record<number, number[]> = {}
  for (const { year, order } of mainIssues) {
    if (year === null || order === null) continue
    takenOrdersByYear[year] = [...(takenOrdersByYear[year] ?? []), order]
  }
  // A supplement names its main issue as far as its viewer sees it
  // (wo02u3xq): the editor by permission, a reader on the web only a
  // published one.
  const visibleNamesByNumber: Record<string, string> = {}
  const publishedNamesByNumber: Record<string, string> = {}
  for (const main of mainIssues) {
    if (main.name === null || main.firstContentAt === null) continue
    const number = `${main.year}/${main.order}`
    if (
      context.can({
        action: 'view',
        entity: 'issue',
        state: main.state,
        targetAuthorIds: [main.authorId],
      }).hasPermission
    ) {
      visibleNamesByNumber[number] = main.name
    }
    if (main.state === 'published') publishedNamesByNumber[number] = main.name
  }

  const submission = getSubmissionState(issue)

  return {
    authors,
    // The year the editor offers for an empty number (log 0034).
    currentYear: getPragueYear(new Date()),
    isApprover,
    // One's own issue has no sentence over it (24c).
    isOwn: issue.author.id === context.authorId,
    issue: {
      authorId: issue.author.id,
      authorName: issue.author.name,
      cover:
        issue.cover === null
          ? null
          : {
              altText: issue.cover.altText,
              sources: createImageSources('issue-cover', issue.cover),
            },
      // A free order to offer for a taken main issue (26d).
      freeOrder: numberConflict?.freeOrder ?? null,
      // An empty draft (log 0020) is left for the list.
      isEmptyDraft: issue.firstContentAt === null,
      name: issue.name ?? '',
      order: issue.order,
      pdf:
        issue.pdf === null
          ? null
          : {
              fileName: issue.pdf.fileName,
              // New with every upload: tells a cancelled replacement from one
              // that saved (log 0029).
              id: issue.pdf.id,
              originalFileName: issue.pdf.originalFileName,
              uploadedAt: formatNumericDate(issue.pdf.uploadedAt),
            },
      // The number it holds since it was published, which keeps the PDF's
      // name (log 0039).
      publishedNumber: issue.publishedNumber,
      state: issue.state,
      // Sent for approval, or approved: the tag and the line of 24c.
      submission:
        submission === null
          ? null
          : { date: submission.date.toISOString(), state: submission.state },
      supplement: issue.supplement ?? '',
      supplementSlug: issue.supplementSlug,
      // The number (`getIssuePublishedNumber`), when another issue holds it
      // as published.
      takenNumber: numberConflict?.takenNumber ?? null,
      // As loaded, for the tab's title; the heading follows the fields.
      title: getIssueTitle(
        issue,
        visibleNamesByNumber[`${issue.year}/${issue.order}`] ?? null,
      ),
      // The last save, which the editor's hold takes back only over (24i).
      updatedAt: issue.updatedAt.toISOString(),
      year: issue.year,
    },
    publishedNamesByNumber,
    takenOrdersByYear,
    visibleNamesByNumber,
  }
}
