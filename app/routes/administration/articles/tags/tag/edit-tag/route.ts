// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Editing a tag is a dialog over its detail (design 30a, 30b).
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/articles/tags/:tagId/edit', { tagId: params.tagId }),
  )
}
