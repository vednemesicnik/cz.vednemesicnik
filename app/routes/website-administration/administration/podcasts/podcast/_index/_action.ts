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
  const id = formData.get("id") ?? params.podcastId

  invariantResponse(typeof id === "string", "Missing podcast ID")
  invariantResponse(typeof intent === "string", "Missing intent")

  // Handle delete action
  if (intent === formConfig.intent.value.delete) {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "delete",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => prisma.podcast.delete({ where: { id } }),
    })

    return redirect(href("/administration/podcasts"))
  }

  // Handle publish action (draft → published)
  if (intent === "publish") {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "publish",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        // Get the podcast with author role and reviews
        const podcast = await prisma.podcast.findUniqueOrThrow({
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
        const isNotCoordinator = podcast.author.role.level !== 1

        // If author is not a Coordinator, require Coordinator review
        if (isNotCoordinator) {
          const hasCoordinatorReview = podcast.reviews.some(
            (review) => review.reviewer.role.level === 1
          )

          invariantResponse(
            hasCoordinatorReview,
            "Nelze publikovat bez schválení koordinátora"
          )
        }

        await prisma.podcast.update({
          where: { id },
          data: { state: "published", publishedAt: new Date() },
        })
      },
    })

    return redirect(
      href("/administration/podcasts/:podcastId", { podcastId: id })
    )
  }

  // Handle retract action (published → draft) TODO: change all its episodes to draft as well
  if (intent === "retract") {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "retract",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.podcast.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {}, // Delete all reviews for this podcast
            },
          },
        })
      },
    })

    return redirect(
      href("/administration/podcasts/:podcastId", { podcastId: id })
    )
  }

  // Handle archive action (published → archived) TODO: change all its episodes to archived as well
  if (intent === "archive") {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "archive",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () =>
        prisma.podcast.update({
          where: { id },
          data: { state: "archived" },
        }),
    })

    return redirect(
      href("/administration/podcasts/:podcastId", { podcastId: id })
    )
  }

  // Handle restore action (archived → draft) TODO: change all its episodes to draft as well
  if (intent === "restore") {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "restore",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.podcast.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {}, // Delete all reviews for this podcast
            },
          },
        })
      },
    })

    return redirect(
      href("/administration/podcasts/:podcastId", { podcastId: id })
    )
  }

  // Handle review action
  if (intent === "review") {
    await withAuthorPermission(request, {
      entity: "podcast",
      action: "review",
      getTarget: () =>
        prisma.podcast.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async (context) => {
        const reviewerId = context.authorId

        // Check if the reviewer has already reviewed this podcast
        const existingReview = await prisma.review.findFirst({
          where: {
            podcastId: id,
            reviewerId,
          },
        })

        // If no existing review, create one
        if (!existingReview) {
          await prisma.review.create({
            data: {
              state: "approved",
              podcastId: id,
              reviewerId,
            },
          })
        }
      },
    })

    return redirect(
      href("/administration/podcasts/:podcastId", { podcastId: id })
    )
  }

  invariantResponse(
    ["delete", "publish", "retract", "archive", "restore", "review"].includes(
      intent
    ),
    "Invalid intent"
  )

  return { status: "success" }
}
