import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireContentUpdatePermission } from '~/utils/permissions/author/guards/require-content-update-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId, episodeId } = params

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      authorId: true,
      description: true,
      id: true,
      links: {
        orderBy: { order: 'asc' },
        select: { label: true, url: true },
      },
      number: true,
      slug: true,
      state: true,
      title: true,
    },
    where: { id: episodeId },
  })

  const context = await getAuthorPermissionContext(request, {
    actions: ['view', 'update'],
    entities: ['podcast_episode'],
  })

  requireContentUpdatePermission(context, {
    authorIds: [episode.authorId],
    id: episodeId,
    kind: 'episode',
    podcastId,
    state: episode.state,
    title: episode.title,
  })

  const authors = await getAuthorsByPermission(
    context,
    'podcast_episode',
    'update',
    episode.state,
  )

  return {
    authors,
    episode,
    podcastId,
  }
}
