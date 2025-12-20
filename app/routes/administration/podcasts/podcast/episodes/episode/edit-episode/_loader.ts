import { href } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { requireAuthorPermission } from '~/utils/permissions/author/guards/require-author-permission.server'
import { getAuthorsByPermission } from '~/utils/permissions/author/queries/get-authors-by-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const { podcastId, episodeId } = params

  const episode = await prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      authorId: true,
      description: true,
      id: true,
      number: true,
      slug: true,
      state: true,
      title: true,
    },
    where: { id: episodeId },
  })

  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast_episode'],
  })

  requireAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode',
    redirectTo: href(
      '/administration/podcasts/:podcastId/episodes/:episodeId',
      { episodeId, podcastId },
    ),
    state: episode.state,
    targetAuthorId: episode.authorId,
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
