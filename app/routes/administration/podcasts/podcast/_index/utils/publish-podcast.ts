import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const publishPodcast = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast",
    action: "publish",
    target: options.target,
    execute: async () => {
      // Get the podcast with author role and reviews
      const podcast = await prisma.podcast.findUniqueOrThrow({
        where: { id: options.id },
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
        where: { id: options.id },
        data: { state: "published", publishedAt: new Date() },
      })
    },
  })