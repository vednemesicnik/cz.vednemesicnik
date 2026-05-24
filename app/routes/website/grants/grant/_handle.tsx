import { href } from 'react-router'
import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const path = href('/grants/:grantSlug', {
      grantSlug: match.params.grantSlug,
    })
    const label = match.loaderData?.grant.name ?? 'Neznámý projekt'

    return { label, path }
  },
}
