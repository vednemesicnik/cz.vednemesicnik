// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Editing a category is a dialog over its detail (design 30a, 30b).
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/articles/categories/:categoryId/edit', {
      categoryId: params.categoryId,
    }),
  )
}
