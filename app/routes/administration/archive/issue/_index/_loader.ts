import { data, href } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
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

import { buildIssuePermissionWhere } from '../../utils/build-issue-permission-where'
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
          id: true,
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

  const [{ title }] = await resolveIssueTitles(
    [issue],
    buildIssuePermissionWhere(context),
  )

  return {
    issue: {
      author: issue.author,
      coverUrl: createImageSources('issue-cover', issue.cover).src ?? null,
      hasCover: !!issue.cover,
      history: await getContentHistory({
        createdAt: issue.createdAt,
        entity: 'issue',
        entityId: issue.id,
        publishedAt: issue.publishedAt,
      }),
      id: issue.id,
      orderLabel: getIssueOrderLabel(issue),
      pdfFileName: issue.pdf?.fileName ?? null,
      pdfUrl: issue.pdf
        ? href('/archive/:fileName', { fileName: issue.pdf.fileName })
        : null,
      publishedAt: createFormattedDate(issue.publishedAt),
      state: issue.state,
      title,
    },
    ...flags,
    submission: flags.submission?.state ?? null,
  }
}
