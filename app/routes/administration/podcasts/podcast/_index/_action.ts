import { href } from 'react-router'

import { runContentStateAction } from '~/utils/content-state/create-content-state-action.server'
import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'
import { podcastContentStateHandlers } from './utils/content-state-handlers.server'

export const action = ({ request, params }: Route.ActionArgs) => {
  const { podcastId } = params

  return runContentStateAction(request, {
    deleteRedirectTo: href('/administration/podcasts'),
    handlers: podcastContentStateHandlers,
    id: podcastId,
    loadTarget: async () => {
      const currentPodcast = await prisma.podcast.findUniqueOrThrow({
        select: { authorId: true, state: true },
        where: { id: podcastId },
      })

      return {
        authorIds: [currentPodcast.authorId],
        state: currentPodcast.state,
      }
    },
  })
}
