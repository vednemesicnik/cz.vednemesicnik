import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { articleId } = match.params

    const label = match.loaderData?.article?.title ?? 'Neznámý článek'
    const path = href(`/administration/articles/:articleId`, { articleId })

    return { label, path }
  },
}
