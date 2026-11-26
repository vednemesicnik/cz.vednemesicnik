/** How many of the newest published items a feed carries. */
export const FEED_ITEM_LIMIT = 20

/** Readers poll; five minutes keeps a new item close without a request per poll. */
export const FEED_CACHE_CONTROL = 'public, max-age=300'
