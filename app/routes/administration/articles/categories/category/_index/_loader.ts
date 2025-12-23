import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { categoryId } = params

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
    entities: ['article_category'],
  })

  const category = await prisma.articleCategory.findUnique({
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
    where: { id: categoryId },
  })

  if (category === null) {
    throw new Response('Kategorie nenalezena', { status: 404 })
  }

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = category.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = category.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article_category',
    state: category.state,
    targetAuthorId: category.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = category.author.role.level === 1
  const isOwnContent = category.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this category
  const hasReviewed = category.reviews.some(
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
    category: {
      author: category.author,
      createdAt: getFormattedPublishDate(category.createdAt),
      hasCoordinatorReview: !!coordinatorReview,
      id: category.id,
      name: category.name,
      publishedAt: getFormattedPublishDate(category.publishedAt),
      reviews: category.reviews.map((review) => ({
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
      slug: category.slug,
      state: category.state,
      updatedAt: getFormattedPublishDate(category.updatedAt),
    },
    hasReviewed,
    needsCoordinatorReview,
  }
}
