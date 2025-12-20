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

    const label = match.loaderData?.user.name ?? 'Neznámý uživatel'
    const path = href(`/administration/users/:userId`, { userId })

    return { label, path }
  },
}
