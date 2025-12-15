import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast"],
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

  const podcast = await prisma.podcast.findUniqueOrThrow({
    where: { id: podcastId },
    select: {
      id: true,
      title: true,
      description: true,
      state: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
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
    entity: "podcast",
    action: "view",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "podcast",
    action: "update",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "podcast",
    action: "delete",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    entity: "podcast",
    action: "publish",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = podcast.reviews.find(
    (review) => review.reviewer.role.level === 1
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = podcast.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    entity: "podcast",
    action: "retract",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    entity: "podcast",
    action: "archive",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    entity: "podcast",
    action: "restore",
    state: podcast.state,
    targetAuthorId: podcast.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "podcast",
    action: "review",
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
    (review) => review.reviewer.id === context.authorId
  )

  return {
    podcast: {
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      state: podcast.state,
      publishedAt: getFormattedPublishDate(podcast.publishedAt),
      createdAt: getFormattedPublishDate(podcast.createdAt),
      updatedAt: getFormattedPublishDate(podcast.updatedAt),
      author: podcast.author,
      hasCover: !!podcast.cover,
      coverUrl: podcast.cover
        ? href("/resources/podcast-cover/:podcastId", { podcastId: podcast.cover.id })
        : null,
      reviews: podcast.reviews.map((review) => ({
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