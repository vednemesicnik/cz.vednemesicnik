import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const restorePodcast = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast",
    action: "restore",
    target: options.target,
    execute: () =>
      prisma.podcast.update({
        where: { id: options.id },
        data: {
          state: "draft",
          publishedAt: null,
          reviews: {
            deleteMany: {}, // Delete all reviews for this podcast
          },
        },
      }),
  })