import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { memberId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["editorial_board_member"],
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

  const member = await prisma.editorialBoardMember.findUniqueOrThrow({
    where: { id: memberId },
    select: {
      id: true,
      fullName: true,
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
      positions: {
        select: {
          id: true,
          key: true,
          pluralLabel: true,
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
    entity: "editorial_board_member",
    action: "view",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "editorial_board_member",
    action: "update",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "editorial_board_member",
    action: "delete",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    entity: "editorial_board_member",
    action: "publish",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = member.reviews.find(
    (review) => review.reviewer.role.level === 1
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = member.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    entity: "editorial_board_member",
    action: "retract",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    entity: "editorial_board_member",
    action: "archive",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    entity: "editorial_board_member",
    action: "restore",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "editorial_board_member",
    action: "review",
    state: member.state,
    targetAuthorId: member.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = member.author.role.level === 1
  const isOwnContent = member.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this member
  const hasReviewed = member.reviews.some(
    (review) => review.reviewer.id === context.authorId
  )

  return {
    member: {
      id: member.id,
      fullName: member.fullName,
      state: member.state,
      publishedAt: getFormattedPublishDate(member.publishedAt),
      createdAt: getFormattedPublishDate(member.createdAt),
      updatedAt: getFormattedPublishDate(member.updatedAt),
      author: member.author,
      positions: member.positions,
      reviews: member.reviews.map((review) => ({
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
