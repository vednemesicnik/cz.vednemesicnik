import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    entities: ["podcast_episode_link"],
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

  const { linkId } = params

  const link = await prisma.podcastEpisodeLink.findUniqueOrThrow({
    where: { id: linkId },
    select: {
      id: true,
      label: true,
      url: true,
      state: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
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
      reviews: {
        select: {
          id: true,
          createdAt: true,
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
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  // Check if user can view this link
  const canView = context.can({
    entity: "podcast_episode_link",
    action: "view",
    state: link.state,
    targetAuthorId: link.authorId,
  }).hasPermission

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "podcast_episode_link",
    action: "review",
    state: link.state,
    targetAuthorId: link.authorId,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = link.author.role.name === "coordinator"
  const isOwnContent = link.authorId === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this link
  const hasReviewed = link.reviews.some(
    (review) => review.reviewer.name === context.authorId
  )

  // Check if link has coordinator review
  const hasCoordinatorReview = link.reviews.some(
    (review) => review.reviewer.role.name === "coordinator"
  )

  // Check if coordinator review is needed (creator trying to publish)
  const needsCoordinatorReview =
    link.author.role.name === "creator" && !hasCoordinatorReview

  return {
    link: {
      id: link.id,
      label: link.label,
      url: link.url,
      state: link.state,
      publishedAt: getFormattedPublishDate(link.publishedAt),
      createdAt: getFormattedPublishDate(link.createdAt),
      updatedAt: getFormattedPublishDate(link.updatedAt),
      author: link.author,
      reviews: link.reviews.map((review) => ({
        id: review.id,
        createdAt: getFormattedPublishDate(review.createdAt),
        reviewer: review.reviewer,
      })),
    },
    canUpdate: context.can({
      entity: "podcast_episode_link",
      action: "update",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canDelete: context.can({
      entity: "podcast_episode_link",
      action: "delete",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canPublish: context.can({
      entity: "podcast_episode_link",
      action: "publish",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canRetract: context.can({
      entity: "podcast_episode_link",
      action: "retract",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canArchive: context.can({
      entity: "podcast_episode_link",
      action: "archive",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canRestore: context.can({
      entity: "podcast_episode_link",
      action: "restore",
      state: link.state,
      targetAuthorId: link.authorId,
    }).hasPermission,
    canReview: shouldShowReview,
    hasReviewed,
    needsCoordinatorReview,
  }
}
