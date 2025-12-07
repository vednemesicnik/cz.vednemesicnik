import { href } from "react-router"

import { prisma } from "~/utils/db.server"
import { getFormattedPublishDate } from "~/utils/get-formatted-publish-date"
import { getAuthorPermissionContext } from "~/utils/permissions/author/context/get-author-permission-context.server"

import type { Route } from "./+types/route"

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { issueId } = params

  const context = await getAuthorPermissionContext(request, {
    entities: ["issue"],
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

  const issue = await prisma.issue.findUniqueOrThrow({
    where: { id: issueId },
    select: {
      id: true,
      label: true,
      releasedAt: true,
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
      pdf: {
        select: {
          id: true,
          fileName: true,
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
    entity: "issue",
    action: "view",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  if (!canView) {
    throw new Response("Forbidden", { status: 403 })
  }

  // Check update permission
  const { hasPermission: canUpdate } = context.can({
    entity: "issue",
    action: "update",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check delete permission
  const { hasPermission: canDelete } = context.can({
    entity: "issue",
    action: "delete",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check publish permission (draft → published)
  const { hasPermission: canPublish } = context.can({
    entity: "issue",
    action: "publish",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Find Coordinator review (level 1)
  const coordinatorReview = issue.reviews.find(
    (review) => review.reviewer.role.level === 1
  )

  // Check if author is not a Coordinator and needs review
  const isNotCoordinator = issue.author.role.level !== 1
  const needsCoordinatorReview = isNotCoordinator && !coordinatorReview

  // Check retract permission (published → draft)
  const { hasPermission: canRetract } = context.can({
    entity: "issue",
    action: "retract",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check archive permission (published → archived)
  const { hasPermission: canArchive } = context.can({
    entity: "issue",
    action: "archive",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check restore permission (archived → draft)
  const { hasPermission: canRestore } = context.can({
    entity: "issue",
    action: "restore",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Check review permission
  const { hasPermission: canReview } = context.can({
    entity: "issue",
    action: "review",
    state: issue.state,
    targetAuthorId: issue.author.id,
  })

  // Don't show review button if:
  // 1. Author is Coordinator (level 1) - they don't need reviews
  // 2. Current user is the author - can't review own content
  const authorIsCoordinator = issue.author.role.level === 1
  const isOwnContent = issue.author.id === context.authorId
  const shouldShowReview = canReview && !authorIsCoordinator && !isOwnContent

  // Check if current user has already reviewed this issue
  const hasReviewed = issue.reviews.some(
    (review) => review.reviewer.id === context.authorId
  )

  return {
    issue: {
      id: issue.id,
      label: issue.label,
      releasedAt: getFormattedPublishDate(issue.releasedAt),
      state: issue.state,
      publishedAt: getFormattedPublishDate(issue.publishedAt),
      createdAt: getFormattedPublishDate(issue.createdAt),
      updatedAt: getFormattedPublishDate(issue.updatedAt),
      author: issue.author,
      hasCover: !!issue.cover,
      coverUrl: issue.cover
        ? href("/resources/issue-cover/:id", { id: issue.cover.id })
        : null,
      pdfFileName: issue.pdf?.fileName ?? null,
      pdfUrl: issue.pdf
        ? href("/archive/:fileName", { fileName: issue.pdf.fileName })
        : null,
      reviews: issue.reviews.map((review) => ({
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
