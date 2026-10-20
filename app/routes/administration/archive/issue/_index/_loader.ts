import { data, href } from 'react-router'

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

import { getArticleFactLine } from '../../../articles/utils/get-article-fact-line'
import { buildIssuePermissionWhere } from '../../utils/build-issue-permission-where'
import { getIssueHeaderActions } from '../../utils/get-issue-header-actions'
import { getIssueSupplementLinks } from '../../utils/get-issue-supplement-links.server'
import type { Route } from './+types/route'

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

  const flags = getContentActionFlags(context, 'issue', {
    authors: [issue.author],
    reviews: issue.reviews,
    state: issue.state,
    submittedAt: issue.submittedAt,
  })

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

  return {
    headerActions: getIssueHeaderActions({
      ...flags,
      state: issue.state,
      submission,
    }),
    isApprover: context.roleLevel <= APPROVER_ROLE_LEVEL,
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
      factLine: getArticleFactLine({
        now: new Date(),
        publishedAt: issue.publishedAt,
        state: issue.state,
        submission: flags.submission,
        updatedAt: issue.updatedAt,
      }),
      history,
      id: issue.id,
      // Signed in, the web shows a draft only with both files (26b).
      isPreviewable:
        issue.state === 'draft' && issue.cover !== null && issue.pdf !== null,
      name: issue.name,
      orderLabel: getIssueOrderLabel(issue),
      pdf:
        issue.pdf === null
          ? null
          : {
              fileName: issue.pdf.fileName,
              originalFileName: issue.pdf.originalFileName,
              path: href('/archive/:fileName', {
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
    submission,
    supplementLinks,
  }
}
