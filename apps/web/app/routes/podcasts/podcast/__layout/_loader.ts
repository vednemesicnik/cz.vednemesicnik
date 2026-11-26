import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import { getWebContentVisibility } from '~/utils/permissions/author/get-web-content-visibility.server'
import { findWebPodcast } from '~/utils/podcast/find-web-podcast.server'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug } = params
  const visibility = await getWebContentVisibility(request, ['podcast'])

  // Gates the episode pages too: a podcast the web may not show takes its episodes
  // with it.
  const webPodcast = await findWebPodcast(podcastSlug, visibility)
  const podcast =
    webPodcast === null
      ? null
      : await prisma.podcast.findUnique({
          select: { title: true },
          where: { id: webPodcast.id },
        })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  return { podcast }
}
