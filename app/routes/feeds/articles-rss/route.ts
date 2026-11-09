// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'
import { createRssFeed } from '~/utils/feeds/create-rss-feed'
import { createRssResponse } from '~/utils/feeds/create-rss-response'
import { loadArticlesFeed } from '../utils/load-articles-feed.server'

export const loader = async () => {
  const feed = await loadArticlesFeed(href('/feeds/articles.xml'))

  return createRssResponse(createRssFeed(feed))
}
