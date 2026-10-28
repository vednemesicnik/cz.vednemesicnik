import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import { getEpisodeDisplayTitle } from '~/utils/podcast-episode/get-episode-display-title'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId, episodeId } = match.params

    // The number, as the web shows it before the title (27c); a draft
    // without one goes by its title (27h), or Epizoda bez názvu (jri2vk3h).
    const episode = match.loaderData?.episode
    const label =
      episode === undefined
        ? 'Neznámá epizoda'
        : episode.number !== null
          ? `#${episode.number}`
          : getEpisodeDisplayTitle(episode.title)
    const path = href(
      `/administration/podcasts/:podcastId/episodes/:episodeId`,
      { episodeId, podcastId },
    )

    return { label, path }
  },
}
