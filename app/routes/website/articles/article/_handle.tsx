import { href } from 'react-router'
import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const path = href('/articles/:articleSlug', {
      articleSlug: match.params.articleSlug,
    })
    const label = match.loaderData?.article.title ?? 'Neznámý článek'

    return { label, path }
  },
}
