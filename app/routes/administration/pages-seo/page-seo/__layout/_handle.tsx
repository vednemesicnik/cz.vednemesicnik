import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { pageSEOId } = match.params

    const label = match.loaderData?.pageSEO?.title ?? 'Neznámé SEO stránky'
    const path = href(`/administration/pages-seo/:pageSEOId`, { pageSEOId })

    return { label, path }
  },
}
