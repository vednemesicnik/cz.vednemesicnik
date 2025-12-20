import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const archiveEpisode = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'archive',
    entity: 'podcast_episode',
    execute: () =>
      prisma.podcastEpisode.update({
        data: { state: 'archived' },
        where: { id: options.id },
      }),
    target: options.target,
  })
