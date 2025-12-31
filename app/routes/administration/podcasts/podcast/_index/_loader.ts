import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId } = params

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
    entities: ['podcast'],
  })

  const podcast = await prisma.podcast.findUniqueOrThrow({
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
      description: true,
      id: true,
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
      title: true,
      updatedAt: true,
    },
    where: { id: podcastId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = podcast.reviews.find(
    (review) => review.reviewer.role.level === 1,
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = podcast.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = podcast.author.role.level === 1
  const isOwnContent = podcast.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this podcast
  const hasReviewed = podcast.reviews.some(
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
    podcast: {
      author: podcast.author,
      coverUrl: podcast.cover
        ? href('/resources/podcast-cover/:coverId', {
            coverId: podcast.cover.id,
          })
        : null,
      createdAt: getFormattedPublishDate(podcast.createdAt),
      description: podcast.description,
      hasCoordinatorReview: !!coordinatorReview,
      hasCover: !!podcast.cover,
      id: podcast.id,
      publishedAt: getFormattedPublishDate(podcast.publishedAt),
      reviews: podcast.reviews.map((review) => ({
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
      state: podcast.state,
      title: podcast.title,
      updatedAt: getFormattedPublishDate(podcast.updatedAt),
    },
  }
}
