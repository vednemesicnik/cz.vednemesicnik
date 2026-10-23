import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { userId } = match.params

    return {
      // The last crumb names the page, the record stands before it (copy 5yrb681l).
      label: 'Úprava',
      path: href(`/administration/users/:userId/edit`, { userId }),
    }
  },
}
