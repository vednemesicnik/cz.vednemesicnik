import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { positionId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_position"],
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

  const position = await prisma.editorialBoardPosition.findUniqueOrThrow({
    where: { id: positionId },
    select: {
      id: true,
      key: true,
      pluralLabel: true,
      order: true,
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
    entity: "editorial_board_position",
    action: "view",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "editorial_board_position",
    action: "update",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "editorial_board_position",
    action: "delete",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    entity: "editorial_board_position",
    action: "publish",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = position.reviews.find(
    (review) => review.reviewer.role.level === 1
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = position.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    entity: "editorial_board_position",
    action: "retract",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    entity: "editorial_board_position",
    action: "archive",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    entity: "editorial_board_position",
    action: "restore",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "editorial_board_position",
    action: "review",
    state: position.state,
    targetAuthorId: position.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = position.author.role.level === 1
  const isOwnContent = position.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this position
  const hasReviewed = position.reviews.some(
    (review) => review.reviewer.id === context.authorId
  )

  return {
    position: {
      id: position.id,
      key: position.key,
      pluralLabel: position.pluralLabel,
      order: position.order,
      state: position.state,
      publishedAt: getFormattedPublishDate(position.publishedAt),
      createdAt: getFormattedPublishDate(position.createdAt),
      updatedAt: getFormattedPublishDate(position.updatedAt),
      author: position.author,
      reviews: position.reviews.map((review) => ({
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
