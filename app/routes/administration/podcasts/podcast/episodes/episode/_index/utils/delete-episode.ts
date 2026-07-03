import { prisma } from '~/utils/db.server'
import { deleteRowWithImages } from '~/utils/image-store/store-image.server'
import { withAuthorPermission } from '~/utils/permissions/author/actions/with-author-permission.server'

type Options = {
  id: string
  target: Parameters<typeof withAuthorPermission>[1]['target']
}

export const deleteEpisode = (request: Request, options: Options) =>
  withAuthorPermission(request, {
    action: 'delete',
    entity: 'podcast_episode',
    execute: () =>
      deleteRowWithImages(
        async () => {
          const episode = await prisma.podcastEpisode.findUnique({
            select: { cover: { select: { id: true } } },
            where: { id: options.id },
          })
          return episode?.cover ? [episode.cover.id] : []
        },
        () => prisma.podcastEpisode.delete({ where: { id: options.id } }),
      ),
    target: options.target,
  })
