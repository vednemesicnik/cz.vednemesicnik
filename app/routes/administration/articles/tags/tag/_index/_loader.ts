import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

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
              publishRequiresReview: true,
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
                  name: true,
                  publishRequiresReview: true,
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
    targetAuthorIds: [tag.author.id],
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Whether an approving review exists and whether one is still needed to publish.
  const hasApprovingReview = tag.reviews.some((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )
  const needsReview = needsReviewToPublish({
    authors: [tag.author],
    reviews: tag.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'article_tag',
    state: tag.state,
    targetAuthorIds: [tag.author.id],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(tag.author.role)
  const isOwnContent = tag.author.id === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

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
    needsReview,
    tag: {
      author: tag.author,
      createdAt: getFormattedPublishDate(tag.createdAt),
      hasApprovingReview,
      id: tag.id,
      name: tag.name,
      publishedAt: getFormattedPublishDate(tag.publishedAt),
      reviews: tag.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
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
