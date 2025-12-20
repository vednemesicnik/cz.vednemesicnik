import { prisma } from '~/utils/db.server'
import { getAuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { checkAuthorPermission } from '~/utils/permissions/author/guards/check-author-permission.server'

import type { Route } from './+types/route'

export const loader = async ({ request, params }: Route.LoaderArgs) => {
  const context = await getAuthorPermissionContext(request, {
    actions: ['update'],
    entities: ['podcast_episode_link'],
  })

  const { podcastId, episodeId, linkId } = params

  const podcastPromise = prisma.podcast.findUniqueOrThrow({
    select: { id: true },
    where: { id: podcastId },
  })

  const episodePromise = prisma.podcastEpisode.findUniqueOrThrow({
    select: {
      id: true,
      state: true,
    },
    where: { id: episodeId },
  })

  const linkPromise = prisma.podcastEpisodeLink.findUniqueOrThrow({
    select: {
      authorId: true,
      id: true,
      label: true,
      url: true,
    },
    where: { id: linkId },
  })

  const authorsPromise = prisma.author.findMany({
    select: {
      id: true,
      name: true,
    },
  })

  const [podcast, episode, link, authors] = await Promise.all([
    podcastPromise,
    episodePromise,
    linkPromise,
    authorsPromise,
  ])

  // Check if user can edit this link
  checkAuthorPermission(context, {
    action: 'update',
    entity: 'podcast_episode_link',
    state: episode.state,
    targetAuthorId: link.authorId,
  })

  return {
    authors,
    episode,
    link,
    podcast,
  }
}
