// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { createRssFeed } from '~/utils/feeds/create-rss-feed'
import { createRssResponse } from '~/utils/feeds/create-rss-response'
import { loadArchiveFeed } from '../utils/load-archive-feed.server'

export const loader = async () => {
  const feed = await loadArchiveFeed(href('/feeds/archive.xml'))

  return createRssResponse(createRssFeed(feed))
}
