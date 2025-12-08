import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode"],
    actions: [
      "view",
      "update",
      "delete",
      "publish",
      "retract",
      "archive",
      "restore",
      "review",
    ],
  })

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    where: { id: episodeId },
    select: {
      id: true,
      number: true,
      title: true,
      slug: true,
      description: true,
      state: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      podcast: {
        select: {
          id: true,
          title: true,
        },
      },
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
      reviews: {
        select: {
          id: true,
          state: true,
          createdAt: true,
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
        },
      },
    },
  })

  // Check view permission
  const { hasPermission: canView } = context.can({
    entity: "podcast_episode",
    action: "view",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "podcast_episode",
    action: "update",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "podcast_episode",
    action: "delete",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    entity: "podcast_episode",
    action: "publish",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = episode.reviews.find(
    (review) => review.reviewer.role.level === 1
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = episode.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    entity: "podcast_episode",
    action: "retract",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    entity: "podcast_episode",
    action: "archive",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    entity: "podcast_episode",
    action: "restore",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "podcast_episode",
    action: "review",
    state: episode.state,
    targetAuthorId: episode.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = episode.author.role.level === 1
  const isOwnContent = episode.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this episode
  const hasReviewed = episode.reviews.some(
    (review) => review.reviewer.id === context.authorId
  )

  return {
    episode: {
      id: episode.id,
      number: episode.number,
      title: episode.title,
      slug: episode.slug,
      description: episode.description,
      state: episode.state,
      publishedAt: getFormattedPublishDate(episode.publishedAt),
      createdAt: getFormattedPublishDate(episode.createdAt),
      updatedAt: getFormattedPublishDate(episode.updatedAt),
      podcast: episode.podcast,
      author: episode.author,
      hasCover: !!episode.cover,
      coverUrl: episode.cover
        ? href("/resources/podcast-episode-cover/:episodeId", {
            episodeId: episode.cover.id,
          })
        : null,
      reviews: episode.reviews.map((review) => ({
        id: review.id,
        state: review.state,
        createdAt: getFormattedPublishDate(review.createdAt),
        reviewer: {
          id: review.reviewer.id,
          name: review.reviewer.name,
          roleName: review.reviewer.role.name,
          roleLevel: review.reviewer.role.level,
        },
      })),
      hasCoordinatorReview: !!coordinatorReview,
    },
    canUpdate,
    canDelete,
    canPublish,
    canRetract,
    canArchive,
    canRestore,
    canReview: shouldShowReview,
    hasReviewed,
    needsCoordinatorReview,
  }
}
