import { FEED_CACHE_CONTROL } from '~/config/feed-config'

/**
 * Wraps a JSON Feed document in an HTTP response for a resource route.
 *
 * @param json - The document from `createJsonFeed`.
 * @returns A response served as `application/feed+json` in UTF-8, publicly
 *   cacheable for five minutes.
 */
export const createJsonFeedResponse = (json: string) => {
  return new Response(json, {
    headers: {
      'Cache-Control': FEED_CACHE_CONTROL,
      'Content-Type': 'application/feed+json; charset=utf-8',
    },
  })
}
