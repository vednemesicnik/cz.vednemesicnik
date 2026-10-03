import { data } from 'react-router'

import { prisma } from '~/utils/db.server'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { podcastSlug } = params
  const visibility = await getWebContentVisibility(request, ['podcast'])

  // Gates the episode pages too: a podcast the web may not show takes its episodes
  // with it.
  const podcast = await prisma.podcast.findUnique({
    select: { title: true },
    where: {
      slug: podcastSlug,
      ...visibility.where('podcast', ownByAuthor, ['draft', 'archived']),
    },
  })

  if (podcast === null) {
    throw data(null, { status: 404 })
  }

  return { podcast }
}
