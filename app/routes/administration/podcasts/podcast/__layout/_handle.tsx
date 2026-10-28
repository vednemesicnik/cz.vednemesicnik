import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId } = match.params

    const podcast = match.loaderData?.podcast
    const label =
      podcast === undefined
        ? 'Neznámý podcast'
        : podcast.isEmptyDraft
          ? 'Nový podcast'
          : getPodcastDisplayTitle(podcast.title)
    const path = href(`/administration/podcasts/:podcastId`, { podcastId })

    return { label, path }
  },
}
