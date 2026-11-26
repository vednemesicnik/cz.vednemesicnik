// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Adding a tag moved to /new (design 30b, log 0016).
export const loader = ({ url }: Route.LoaderArgs) => {
  throw redirectPermanently(url, href('/administration/articles/tags/new'))
}
