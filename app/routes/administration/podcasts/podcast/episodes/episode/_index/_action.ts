import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { episodeContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { podcastId, episodeId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/podcasts/:podcastId/episodes', {
      podcastId,
    }),
    handlers: episodeContentStateHandlers,
    id: episodeId,
    loadTarget: async () => {
      const currentEpisode = await prisma.podcastEpisode.findUniqueOrThrow({
        select: { authorId: true, state: true },
        where: { id: episodeId },
      })

      return {
        authorIds: [currentEpisode.authorId],
        state: currentEpisode.state,
      }
    },
    supportsChangePublishedAt: true,
  })
}
