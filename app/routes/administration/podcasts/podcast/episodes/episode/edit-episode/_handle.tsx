import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  // The trail ends in Úprava for the empty draft too (27d, jri2vk3h).
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId, episodeId } = match.params

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
