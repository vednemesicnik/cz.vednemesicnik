import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { podcastId } = match.params

    const label = 'Upravit podcast'
    const path = href('/administration/podcasts/:podcastId/edit-podcast', {
      podcastId,
    })

    return { label, path }
  },
}
