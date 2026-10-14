import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId, episodeId } = match.params

    // The number, as the web shows it before the title (27c).
    const number = match.loaderData?.episode.number
    const label = number === undefined ? 'Neznámá epizoda' : `#${number}`
    const path = href(
      `/administration/podcasts/:podcastId/episodes/:episodeId`,
      { episodeId, podcastId },
    )

    return { label, path }
  },
}
