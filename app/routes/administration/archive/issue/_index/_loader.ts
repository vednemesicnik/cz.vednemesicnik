import { data, href } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { createFormattedDate } from '~/utils/format-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

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
      label: true,
      pdf: {
        select: {
          fileName: true,
          id: true,
        },
      },
      publishedAt: true,
      releasedAt: true,
      reviews: {
        select: {
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      state: true,
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

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Whether an approving review is still needed to publish.
  const needsReview = needsReviewToPublish({
    authors: [issue.author],
    reviews: issue.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'issue',
    state: issue.state,
    targetAuthorIds: [issue.author.id],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(
    issue.author.role,
  )
  const isOwnContent = issue.author.id === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

  // Check if current user has already reviewed this issue
  const hasReviewed = issue.reviews.some(
    (review) => review.reviewer.id === context.authorId,
  )

  return {
    canArchive,
    canDelete,
    canPublish,
    canRestore,
    canRetract,
    canReview: shouldShowReview,
    canUpdate,
    hasReviewed,
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
      label: issue.label,
      pdfFileName: issue.pdf?.fileName ?? null,
      pdfUrl: issue.pdf
        ? href('/archive/:fileName', { fileName: issue.pdf.fileName })
        : null,
      publishedAt: createFormattedDate(issue.publishedAt),
      releasedAt: createFormattedDate(issue.releasedAt),
      state: issue.state,
    },
    needsReview,
  }
}
