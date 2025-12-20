import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { positionId } = params

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
    entities: ['editorial_board_position'],
  })

  const position = await prisma.editorialBoardPosition.findUniqueOrThrow({
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
      createdAt: true,
      id: true,
      key: true,
      order: true,
      pluralLabel: true,
      publishedAt: true,
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
    where: { id: positionId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = position.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = position.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'editorial_board_position',
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = position.author.role.level === 1
  const isOwnContent = position.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this position
  const hasReviewed = position.reviews.some(
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
    needsCoordinatorReview,
    position: {
      author: position.author,
      createdAt: getFormattedPublishDate(position.createdAt),
      hasCoordinatorReview: !!coordinatorReview,
      id: position.id,
      key: position.key,
      order: position.order,
      pluralLabel: position.pluralLabel,
      publishedAt: getFormattedPublishDate(position.publishedAt),
      reviews: position.reviews.map((review) => ({
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
      state: position.state,
      updatedAt: getFormattedPublishDate(position.updatedAt),
    },
  }
}
