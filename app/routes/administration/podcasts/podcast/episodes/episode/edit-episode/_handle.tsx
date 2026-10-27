import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb | null => {
    const { podcastId, episodeId } = match.params

    // A new draft's trail is „Podcasty / Kabinet / Nová epizoda“ (27d).
    if (match.loaderData?.episode.isEmptyDraft) return null

    return {
      // The last crumb names the page, the record stands before it (copy 5yrb681l).
      label: 'Úprava',
      path: href(
        '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
        { episodeId, podcastId },
      ),
    }
  },
  // The edit hold keeps the editor current; a reload could lose unsent text (log 0042).
  skipsOwnAccountReload: true,
}
