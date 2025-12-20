import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

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
              name: true,
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
              name: true,
              role: {
                select: {
                  name: true,
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
    targetAuthorId: link.authorId,
  }).hasPermission

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'podcast_episode_link',
    state: link.state,
    targetAuthorId: link.authorId,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = link.author.role.name === 'coordinator'
  const isOwnContent = link.authorId === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this link
  const hasReviewed = link.reviews.some(
    (review) => review.reviewer.name === context.authorId,
  )

  // Check if link has coordinator review
  const hasCoordinatorReview = link.reviews.some(
    (review) => review.reviewer.role.name === 'coordinator',
  )

  // Check if coordinator review is needed (creator trying to publish)
  const needsCoordinatorReview =
    link.author.role.name === 'creator' && !hasCoordinatorReview

  return {
    canArchive: context.can({
      action: 'archive',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canDelete: context.can({
      action: 'delete',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canPublish: context.can({
      action: 'publish',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canRestore: context.can({
      action: 'restore',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canRetract: context.can({
      action: 'retract',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canReview: shouldShowReview,
    canUpdate: context.can({
      action: 'update',
      entity: 'podcast_episode_link',
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    hasReviewed,
    link: {
      author: link.author,
      createdAt: getFormattedPublishDate(link.createdAt),
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
    needsCoordinatorReview,
  }
}
