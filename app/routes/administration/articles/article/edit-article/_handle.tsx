import { href } from 'react-router'
import type { Breadcrumb } from '~/types/breadcrumb'
import type { Route } from './+types/route'

export const handle = {
  breadcrumb: ({ params }: Route.LoaderArgs): Breadcrumb => {
    const { articleId } = params

    return {
      label: 'Upravit článek',
      path: href('/administration/articles/:articleId/edit-article', {
        articleId,
      }),
    }
  },
}
