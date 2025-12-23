import { href } from 'react-router'

import type { Breadcrumb, BreadcrumbMatch } from '~/types/breadcrumb'
import type { Route } from './+types/route'

type Match = BreadcrumbMatch<
  Route.ComponentProps['loaderData'],
  Route.ComponentProps['params']
>

export const handle = {
  breadcrumb: (match: Match): Breadcrumb => {
    const { categoryId } = match.params

    const label = 'Upravit kategorii'
    const path = href(
      '/administration/articles/categories/:categoryId/edit-category',
      {
        categoryId,
      },
    )

    return { label, path }
  },
}
