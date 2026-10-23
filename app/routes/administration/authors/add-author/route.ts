// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Adding an author moved to /new (design 30b, 28c), the query with it.
export const loader = ({ url }: Route.LoaderArgs) => {
  throw redirectPermanently(url, href('/administration/authors/new'))
}
