import { invariantResponse } from "@epic-web/invariant"
import { href, redirect } from "react-router"

import { formConfig } from "~/config/form-config"
import { validateCSRF } from "~/utils/csrf.server"
import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

import type { Route } from "./+types/route"

export const action = async ({ request, params }: Route.ActionArgs) => {
  const formData = await request.formData()
  await validateCSRF(formData, request.headers)

  const intent = formData.get(formConfig.intent.name)
  const id = formData.get("id") ?? params.issueId

  invariantResponse(typeof id === "string", "Missing issue ID")
  invariantResponse(typeof intent === "string", "Missing intent")

  // Handle delete action
  if (intent === formConfig.intent.value.delete) {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "delete",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => prisma.issue.delete({ where: { id } }),
    })

    return redirect(href("/administration/archive"))
  }

  // Handle publish action (draft → published)
  if (intent === "publish") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "publish",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        // Get the issue with author role and reviews
        const issue = await prisma.issue.findUniqueOrThrow({
          where: { id },
          select: {
            author: {
              select: {
                role: {
                  select: {
                    level: true,
                  },
                },
              },
            },
            reviews: {
              select: {
                reviewer: {
                  select: {
                    role: {
                      select: {
                        level: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })

        // Check if author is not a Coordinator (level !== 1)
        const isNotCoordinator = issue.author.role.level !== 1

        // If author is not a Coordinator, require Coordinator review
        if (isNotCoordinator) {
          const hasCoordinatorReview = issue.reviews.some(
            (review) => review.reviewer.role.level === 1
          )

          invariantResponse(
            hasCoordinatorReview,
            "Nelze publikovat bez schválení koordinátora"
          )
        }

        await prisma.issue.update({
          where: { id },
          data: { state: "published", publishedAt: new Date() },
        })
      },
    })

    return redirect(href("/administration/archive/:issueId", { issueId: id }))
  }

  // Handle retract action (published → draft)
  if (intent === "retract") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "retract",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.issue.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {}, // Delete all reviews for this issue
            },
          },
        })
      },
    })

    return redirect(href("/administration/archive/:issueId", { issueId: id }))
  }

  // Handle archive action (published → archived)
  if (intent === "archive") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "archive",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () =>
        prisma.issue.update({
          where: { id },
          data: { state: "archived" },
        }),
    })

    return redirect(href("/administration/archive/:issueId", { issueId: id }))
  }

  // Handle restore action (archived → draft)
  if (intent === "restore") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "restore",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.issue.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {}, // Delete all reviews for this issue
            },
          },
        })
      },
    })

    return redirect(href("/administration/archive/:issueId", { issueId: id }))
  }

  // Handle review action
  if (intent === "review") {
    await withAuthorPermission(request, {
      entity: "issue",
      action: "review",
      getTarget: () =>
        prisma.issue.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async (context) => {
        const reviewerId = context.authorId

        // Check if the reviewer has already reviewed this issue
        const existingReview = await prisma.review.findFirst({
          where: {
            issueId: id,
            reviewerId,
          },
        })

        // If no existing review, create one
        if (!existingReview) {
          await prisma.review.create({
            data: {
              state: "approved",
              issueId: id,
              reviewerId,
            },
          })
        }
      },
    })

    return redirect(href("/administration/archive/:issueId", { issueId: id }))
  }

  invariantResponse(
    ["delete", "publish", "retract", "archive", "restore", "review"].includes(
      intent
    ),
    "Invalid intent"
  )

  return { status: "success" }
}
