import { prisma } from '~/utils/db.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const restoreLink = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'restore',
    entity: 'podcast_episode_link',
    execute: () =>
      prisma.podcastEpisodeLink.update({
        data: {
          publishedAt: null,
          reviews: {
            deleteMany: {}, // Delete all reviews for this link
          },
          state: 'draft',
        },
        where: { id: options.id },
      }),
    target: options.target,
  })
