import { prisma } from '~/utils/db.server'
import { getFormattedPublishDate } from '~/utils/get-formatted-publish-date'
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
  const { episodeId } = params

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
    entities: ['podcast_episode'],
  })

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
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
      number: true,
      podcast: {
        select: {
          id: true,
          title: true,
        },
      },
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
      title: true,
      updatedAt: true,
    },
    where: { id: episodeId },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    action: 'view',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  if (!canView) {
    throw new Response('Forbidden', { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    action: 'update',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    action: 'delete',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    action: 'publish',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Whether an approving review exists and whether one is still needed to publish.
  const hasApprovingReview = episode.reviews.some((review) =>
    canPublishWithoutReview(review.reviewer.role),
  )
  const needsReview = needsReviewToPublish({
    authors: [episode.author],
    reviews: episode.reviews,
  })

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    action: 'retract',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    action: 'archive',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    action: 'restore',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    action: 'review',
    entity: 'podcast_episode',
    state: episode.state,
    targetAuthorIds: [episode.author.id],
  })

  // Don't show review button if:
  // 1. Author can publish without review - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorCanPublishWithoutReview = canPublishWithoutReview(
    episode.author.role,
  )
  const isOwnContent = episode.author.id === context.authorId
  const shouldShowReview =
    canReview && !authorCanPublishWithoutReview && !isOwnContent

  // Check if current user has already reviewed this episode
  const hasReviewed = episode.reviews.some(
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
    episode: {
      author: episode.author,
      coverUrl:
        createImageSources('podcast-episode-cover', episode.cover).src ?? null,
      createdAt: getFormattedPublishDate(episode.createdAt),
      description: episode.description,
      hasApprovingReview,
      hasCover: !!episode.cover,
      id: episode.id,
      number: episode.number,
      podcast: episode.podcast,
      publishedAt: getFormattedPublishDate(episode.publishedAt),
      reviews: episode.reviews.map((review) => ({
        createdAt: getFormattedPublishDate(review.createdAt),
        id: review.id,
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
          roleName: review.reviewer.role.name,
        },
        state: review.state,
      })),
      slug: episode.slug,
      state: episode.state,
      title: episode.title,
      updatedAt: getFormattedPublishDate(episode.updatedAt),
    },
    hasReviewed,
    needsReview,
  }
}
