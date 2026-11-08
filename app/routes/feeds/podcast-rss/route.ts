// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { createRssFeed } from '~/utils/feeds/create-rss-feed'
import { createRssResponse } from '~/utils/feeds/create-rss-response'
import { loadPodcastFeed } from '../utils/load-podcast-feed.server'
import type { Route } from './+types/route'

export const loader = async ({ params }: Route.LoaderArgs) => {
  const { podcastId } = params
  const feed = await loadPodcastFeed(
    podcastId,
    href('/feeds/podcasts/:podcastId.xml', { podcastId }),
  )

  // A bare 404: a feed reader has no use for the website's error page.
  if (feed === null) {
    throw new Response(null, { status: 404 })
  }

  return createRssResponse(createRssFeed(feed))
}
