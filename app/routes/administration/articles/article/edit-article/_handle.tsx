import { href } from 'react-router'
import type { Breadcrumb } from '~/types/breadcrumb'
import type { Route } from './+types/route'

export const handle = {
  breadcrumb: ({ params }: Route.LoaderArgs): Breadcrumb => {
    const { articleId } = params

    return {
      label: 'Úprava',
      path: href('/administration/articles/:articleId/edit-article', {
        articleId,
      }),
    }
  },
  // On a phone the editor's own bar replaces the top bar (24f).
  hasOwnMobileBar: true,
}
