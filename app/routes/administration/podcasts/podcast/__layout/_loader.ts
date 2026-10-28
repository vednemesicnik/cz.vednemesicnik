import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastId } = params

  const podcast = await prisma.podcast.findUnique({
    select: {
      firstContentAt: true,
      id: true,
      title: true,
    },
    where: { id: podcastId },
  })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  return {
    podcast: {
      id: podcast.id,
      // A new draft is named as the button that made it until its first save
      // (27e); its editor adds no crumb of its own.
      isEmptyDraft: podcast.firstContentAt === null,
      title: podcast.title,
    },
  }
}
