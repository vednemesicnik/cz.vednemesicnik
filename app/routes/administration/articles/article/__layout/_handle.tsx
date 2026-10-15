import { href } from 'react-router'

import { getArticleDisplayTitle } from '~/routes/administration/articles/utils/get-article-display-title'
import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'

import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { articleId } = match.params

    const title = match.loaderData?.article?.title
    const label =
      title === undefined ? 'Neznámý článek' : getArticleDisplayTitle(title)
    const path = href(`/administration/articles/:articleId`, { articleId })

    return { label, path }
  },
}
