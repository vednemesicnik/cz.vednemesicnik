// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Editing a category moved to /edit (design 30b, decision 0016).
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/articles/categories/:categoryId/edit', {
      categoryId: params.categoryId,
    }),
  )
}
