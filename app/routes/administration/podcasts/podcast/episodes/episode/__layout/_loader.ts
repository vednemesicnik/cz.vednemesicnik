import { data } from 'react-router'

import { prisma } from '~/utils/db.server'

import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { episodeId } = params

  const episode = await prisma.podcastEpisode.findUnique({
    select: {
      firstContentAt: true,
      id: true,
      number: true,
      title: true,
    },
    where: { id: episodeId },
  })

  if (episode === null) {
    throw data(null, { status: 404 })
  }

  return {
    episode: {
      id: episode.id,
      // A new draft is named as the button that made it until its first save
      // (27d); its editor adds no crumb of its own.
      isEmptyDraft: episode.firstContentAt === null,
      number: episode.number,
      title: episode.title,
    },
  }
}
