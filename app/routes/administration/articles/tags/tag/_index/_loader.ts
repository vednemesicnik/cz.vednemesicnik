import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { tagId } = params

  const tag = await prisma.articleTag.findUnique({
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
      name: true,
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
      slug: true,
      state: true,
      updatedAt: true,
    },
    where: { id: tagId },
  })

  if (tag === null) {
    throw new Response('Tag nenalezen', { status: 404 })
  }

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
    entities: ['article_tag'],
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = tag.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = tag.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorId: tag.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = tag.author.role.level === 1
  const isOwnContent = tag.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this tag
  const hasReviewed = tag.reviews.some(
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
    tag: {
      author: tag.author,
      createdAt: getFormattedPublishDate(tag.createdAt),
      hasCoordinatorReview: !!coordinatorReview,
      id: tag.id,
      name: tag.name,
      publishedAt: getFormattedPublishDate(tag.publishedAt),
      reviews: tag.reviews.map((review) => ({
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
      slug: tag.slug,
      state: tag.state,
      updatedAt: getFormattedPublishDate(tag.updatedAt),
    },
  }
}
