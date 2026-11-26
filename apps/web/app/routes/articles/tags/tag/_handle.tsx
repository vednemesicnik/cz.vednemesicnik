import { href } from 'react-router'
import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const path = href('/articles/tags/:slug', { slug: match.params.slug })
    const label = match.loaderData?.tag.name ?? 'Neznámý štítek'

    return { label, path }
  },
}
