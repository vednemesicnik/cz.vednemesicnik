// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Adding a category is a dialog over the list (design 30a, 30b).
export const loader = ({ url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/articles/categories/new'),
  )
}
