import { FEED_CACHE_CONTROL } from '~/config/feed-config'

/**
 * Wraps an RSS document in an HTTP response for a resource route.
 *
 * @param xml - The document from `createRssFeed`.
 * @returns A response served as `application/rss+xml` in UTF-8, publicly cacheable
 *   for five minutes.
 */
export const createRssResponse = (xml: string) => {
  return new Response(xml, {
    headers: {
      'Cache-Control': FEED_CACHE_CONTROL,
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
