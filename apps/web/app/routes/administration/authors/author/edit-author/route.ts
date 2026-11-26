// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { redirectPermanently } from '~/utils/redirect-permanently'
import type { Route } from './+types/route'

// Editing an author moved to /edit (design 30b, 28c).
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirectPermanently(
    url,
    href('/administration/authors/:authorId/edit', {
      authorId: params.authorId,
    }),
  )
}
