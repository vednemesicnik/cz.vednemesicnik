import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

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
        select: {
          id: true,
        },
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
          createdAt: true,
          id: true,
          reviewer: {
            select: {
              id: true,
              name: true,
              role: {
                select: {
                  level: true,
                  name: true,
                },
              },
            },
          },
          state: true,
        },
      },
      state: true,
      updatedAt: true,
    },
    where: { id: issueId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = issue.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = issue.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'issue',
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = issue.author.role.level === 1
  const isOwnContent = issue.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

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
      coverUrl: issue.cover
        ? href('/resources/issue-cover/:coverId', { coverId: issue.cover.id })
        : null,
      createdAt: getFormattedPublishDate(issue.createdAt),
      hasCoordinatorReview: !!coordinatorReview,
      hasCover: !!issue.cover,
      id: issue.id,
      label: issue.label,
      pdfFileName: issue.pdf?.fileName ?? null,
      pdfUrl: issue.pdf
        ? href('/archive/:fileName', { fileName: issue.pdf.fileName })
        : null,
      publishedAt: getFormattedPublishDate(issue.publishedAt),
      releasedAt: getFormattedPublishDate(issue.releasedAt),
      reviews: issue.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
          roleLevel: review.reviewer.role.level,
          roleName: review.reviewer.role.name,
        },
        state: review.state,
      })),
      state: issue.state,
      updatedAt: getFormattedPublishDate(issue.updatedAt),
    },
    needsCoordinatorReview,
  }
}
