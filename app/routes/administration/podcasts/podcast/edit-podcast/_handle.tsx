import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  // „Podcasty / Podcast bez názvu / Úprava“ for the empty draft too (27e, jri2vk3h).
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId } = match.params

    return {
      // The last crumb names the page, the record stands before it (copy 5yrb681l).
      label: 'Úprava',
      path: href('/administration/podcasts/:podcastId/edit-podcast', {
        podcastId,
      }),
    }
  },
  // The edit hold keeps the editor current; a reload could lose unsent text (log 0042).
  skipsOwnAccountReload: true,
}
