import { data } from 'react-router'

import { getContentHistory } from '~/utils/content-log/get-content-history.server'
import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

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
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      slug: true,
      state: true,
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
    targetAuthorIds: [category.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Whether an approving review is still needed to publish.
  const needsReview = needsReviewToPublish({
    authors: [category.author],
    reviews: category.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article_category',
    state: category.state,
    targetAuthorIds: [category.author.id],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(
    category.author.role,
  )
  const isOwnContent = category.author.id === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

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
      history: await getContentHistory({
        createdAt: category.createdAt,
        entity: 'article_category',
        entityId: category.id,
        publishedAt: category.publishedAt,
      }),
      id: category.id,
      name: category.name,
      slug: category.slug,
      state: category.state,
    },
    hasReviewed,
    needsReview,
  }
}
