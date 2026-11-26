// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { createJsonFeed } from '~/utils/feeds/create-json-feed'
import { createJsonFeedResponse } from '~/utils/feeds/create-json-feed-response'
import { loadArticlesFeed } from '../utils/load-articles-feed.server'

export const loader = async () => {
  const feed = await loadArticlesFeed(href('/feeds/articles.json'))

  return createJsonFeedResponse(createJsonFeed(feed))
}
