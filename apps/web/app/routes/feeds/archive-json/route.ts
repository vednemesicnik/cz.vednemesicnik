// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { createJsonFeed } from '~/utils/feeds/create-json-feed'
import { createJsonFeedResponse } from '~/utils/feeds/create-json-feed-response'
import { loadArchiveFeed } from '../utils/load-archive-feed.server'

export const loader = async () => {
  const feed = await loadArchiveFeed(href('/feeds/archive.json'))

  return createJsonFeedResponse(createJsonFeed(feed))
}
