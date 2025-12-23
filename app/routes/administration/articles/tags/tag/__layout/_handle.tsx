import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { tagId } = match.params

    const label = match.loaderData?.tagName ?? 'Neznámý tag'
    const path = href('/administration/articles/tags/:tagId', {
      tagId,
    })

    return { label, path }
  },
}
