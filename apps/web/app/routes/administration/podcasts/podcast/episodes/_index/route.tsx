// noinspection JSUnusedGlobalSymbols

import { href, redirect } from 'react-router'

import type { Route } from './+types/route'

export { action } from './_action'

/**
 * The podcast's page holds its episodes (design 27b), so the old list
 * address leads there, its filters and paging kept. Its action stays: the
 * episode table's bulk delete posts here.
 */
export const loader = ({ params, url }: Route.LoaderArgs) => {
  throw redirect(
    `${href('/administration/podcasts/:podcastId', { podcastId: params.podcastId })}${url.search}`,
  )
}
