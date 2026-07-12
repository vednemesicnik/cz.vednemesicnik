import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import {
  canPublishWithoutReview,
  needsReviewToPublish,
} from '~/utils/permissions/author/review-policy'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
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
    entities: ['podcast_episode_link'],
  })

  const { linkId } = params

  const link = await prisma.podcastEpisodeLink.findUniqueOrThrow({
    select: {
      author: {
        select: {
          name: true,
          role: {
            select: {
              publishRequiresReview: true,
            },
          },
        },
      },
      authorId: true,
      createdAt: true,
      id: true,
      label: true,
      publishedAt: true,
      reviews: {
        orderBy: {
          createdAt: 'desc',
        },
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
        },
      },
      state: true,
      updatedAt: true,
      url: true,
    },
    where: { id: linkId },
  })

  // Check if user can view this link
  const canView = context.can({
    action: 'view',
    entity: 'podcast_episode_link',
    state: link.state,
    targetAuthorIds: [link.authorId],
  }).hasPermission

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'podcast_episode_link',
    state: link.state,
    targetAuthorIds: [link.authorId],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(
    link.author.role,
  )
  const isOwnContent = link.authorId === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

  // Check if current user has already reviewed this link
  const hasReviewed = link.reviews.some(
    (review) => review.reviewer.id === context.authorId,
  )

  // Whether an approving review exists and whether one is still needed to publish.
  const hasApprovingReview = link.reviews.some((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )
  const needsReview = needsReviewToPublish({
    authors: [link.author],
    reviews: link.reviews,
  })

  return {
    canArchive: context.can({
      action: 'archive',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    canDelete: context.can({
      action: 'delete',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    canPublish: context.can({
      action: 'publish',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    canRestore: context.can({
      action: 'restore',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    canRetract: context.can({
      action: 'retract',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    canReview: shouldShowReview,
    canUpdate: context.can({
      action: 'update',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorIds: [link.authorId],
    }).hasPermission,
    hasReviewed,
    link: {
      author: link.author,
      createdAt: getFormattedPublishDate(link.createdAt),
      hasApprovingReview,
      id: link.id,
      label: link.label,
      publishedAt: getFormattedPublishDate(link.publishedAt),
      reviews: link.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: review.reviewer,
      })),
      state: link.state,
      updatedAt: getFormattedPublishDate(link.updatedAt),
      url: link.url,
    },
    needsReview,
  }
}
