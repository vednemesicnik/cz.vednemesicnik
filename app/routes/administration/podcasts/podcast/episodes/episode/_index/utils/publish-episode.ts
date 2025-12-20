import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const publishEpisode = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast_episode",
    action: "publish",
    target: options.target,
    execute: async () => {
      // Get the episode with author role and reviews
      const episode = await prisma.podcastEpisode.findUniqueOrThrow({
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
      const isNotCoordinator = episode.author.role.level !== 1

      // If author is not a Coordinator, require Coordinator review
      if (isNotCoordinator) {
        const hasCoordinatorReview = episode.reviews.some(
          (review) => review.reviewer.role.level === 1
        )

        invariantResponse(
          hasCoordinatorReview,
          "Nelze publikovat bez schválení koordinátora"
        )
      }

      await prisma.podcastEpisode.update({
        where: { id: options.id },
        data: { state: "published", publishedAt: new Date() },
      })
    },
  })
