import { prisma } from "~/utils/db.server"
import { withAuthorPermission } from "~/utils/permissions/author/actions/with-author-permission.server"

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]["target"]
}

export const archiveLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    entity: "podcast_episode_link",
    action: "archive",
    target: options.target,
    execute: () =>
      prisma.podcastEpisodeLink.update({
        where: { id: options.id },
        data: { state: "archived" },
      }),
  })