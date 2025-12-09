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
  const id = formData.get("id") ?? params.linkId
  const { podcastId, episodeId } = params

  invariantResponse(typeof id === "string", "Missing link ID")
  invariantResponse(typeof intent === "string", "Missing intent")

  // Handle delete action
  if (intent === formConfig.intent.value.delete) {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "delete",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => prisma.podcastEpisodeLink.delete({ where: { id } }),
    })

    return redirect(
      href("/administration/podcasts/:podcastId/episodes/:episodeId/links", {
        podcastId,
        episodeId,
      })
    )
  }

  // Handle publish action (draft → published)
  if (intent === "publish") {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "publish",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        // Get the link with author role and reviews
        const link = await prisma.podcastEpisodeLink.findUniqueOrThrow({
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
        const isNotCoordinator = link.author.role.level !== 1

        // If author is not a Coordinator, require Coordinator review
        if (isNotCoordinator) {
          const hasCoordinatorReview = link.reviews.some(
            (review) => review.reviewer.role.level === 1
          )

          invariantResponse(
            hasCoordinatorReview,
            "Nelze publikovat bez schválení koordinátora"
          )
        }

        await prisma.podcastEpisodeLink.update({
          where: { id },
          data: { state: "published", publishedAt: new Date() },
        })
      },
    })

    return redirect(
      href(
        "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
        {
          podcastId,
          episodeId,
          linkId: id,
        }
      )
    )
  }

  // Handle retract action (published → draft)
  if (intent === "retract") {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "retract",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.podcastEpisodeLink.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {},
            },
          },
        })
      },
    })

    return redirect(
      href(
        "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
        {
          podcastId,
          episodeId,
          linkId: id,
        }
      )
    )
  }

  // Handle archive action (published → archived)
  if (intent === "archive") {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "archive",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () =>
        prisma.podcastEpisodeLink.update({
          where: { id },
          data: { state: "archived" },
        }),
    })

    return redirect(
      href(
        "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
        {
          podcastId,
          episodeId,
          linkId: id,
        }
      )
    )
  }

  // Handle restore action (archived → draft)
  if (intent === "restore") {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "restore",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async () => {
        await prisma.podcastEpisodeLink.update({
          where: { id },
          data: {
            state: "draft",
            publishedAt: null,
            reviews: {
              deleteMany: {},
            },
          },
        })
      },
    })

    return redirect(
      href(
        "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
        {
          podcastId,
          episodeId,
          linkId: id,
        }
      )
    )
  }

  // Handle review action
  if (intent === "review") {
    await withAuthorPermission(request, {
      entity: "podcast_episode_link",
      action: "review",
      getTarget: () =>
        prisma.podcastEpisodeLink.findUniqueOrThrow({
          where: { id },
          select: { authorId: true, state: true },
        }),
      execute: async (context) => {
        const reviewerId = context.authorId

        // Check if the reviewer has already reviewed this link
        const existingReview = await prisma.review.findFirst({
          where: {
            podcastEpisodeLinkId: id,
            reviewerId,
          },
        })

        // If no existing review, create one
        if (!existingReview) {
          await prisma.review.create({
            data: {
              state: "approved",
              podcastEpisodeLinkId: id,
              reviewerId,
            },
          })
        }
      },
    })

    return redirect(
      href(
        "/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId",
        {
          podcastId,
          episodeId,
          linkId: id,
        }
      )
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