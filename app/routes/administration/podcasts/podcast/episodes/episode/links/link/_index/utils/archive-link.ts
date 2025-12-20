import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const archiveLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'archive',
    entity: 'podcast_episode_link',
    execute: () =>
      prisma.podcastEpisodeLink.update({
        data: { state: 'archived' },
        where: { id: options.id },
      }),
    target: options.target,
  })
