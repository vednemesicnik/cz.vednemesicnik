import { href } from 'react-router'
import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const path = href('/articles/category/:slug', { slug: match.params.slug })
    const label = match.loaderData?.category.name ?? 'Neznámá rubrika'

    return { label, path }
  },
}
