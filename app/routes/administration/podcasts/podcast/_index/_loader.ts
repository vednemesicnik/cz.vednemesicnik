import { data } from 'react-router'

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
        select: imageSourceSelect,
      },
      createdAt: true,
      description: true,
      id: true,
      publishedAt: true,
      reviews: {
        select: {
          reviewer: {
            select: { id: true, role: { select: { level: true } } },
          },
        },
      },
      state: true,
      title: true,
    },
    where: { id: podcastId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // A record the person may not see is a 404, like a deleted one (design 30e).
  if (!canView) {
    throw data(null, { status: 404 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Whether an approving review is still needed to publish.
  const needsReview = needsReviewToPublish({
    authors: [podcast.author],
    reviews: podcast.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'podcast',
    state: podcast.state,
    targetAuthorIds: [podcast.author.id],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(
    podcast.author.role,
  )
  const isOwnContent = podcast.author.id === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

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
    needsReview,
    podcast: {
      author: podcast.author,
      coverUrl: createImageSources('podcast-cover', podcast.cover).src ?? null,
      description: podcast.description,
      hasCover: !!podcast.cover,
      history: await getContentHistory({
        createdAt: podcast.createdAt,
        entity: 'podcast',
        entityId: podcast.id,
        publishedAt: podcast.publishedAt,
      }),
      id: podcast.id,
      publishedAt: createFormattedDate(podcast.publishedAt),
      state: podcast.state,
      title: podcast.title,
    },
  }
}
