import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const retractLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast_episode_link",
    action: "retract",
    target: options.target,
    execute: () =>
      prisma.podcastEpisodeLink.update({
        where: { id: options.id },
        data: {
          state: "draft",
          publishedAt: null,
          reviews: {
            deleteMany: {}, // Delete all reviews for this link
          },
        },
      }),
  })