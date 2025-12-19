import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const deleteLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast_episode_link",
    action: "delete",
    target: options.target,
    execute: () =>
      prisma.podcastEpisodeLink.delete({ where: { id: options.id } }),
  })
