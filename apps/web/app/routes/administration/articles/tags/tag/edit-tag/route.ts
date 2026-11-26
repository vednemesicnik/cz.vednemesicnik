// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Editing a tag moved to /edit (design 30b, log 0016).
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/articles/tags/:tagId/edit', { tagId: params.tagId }),
  )
}
