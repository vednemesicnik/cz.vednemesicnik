/** The feed as a whole: what a reader shows above its items. */
export type FeedChannel = {
  title: string
  description: string
  /** The page the feed belongs to, absolute. */
  link: string
  /** The feed's own address, absolute. */
  feedUrl: string
}

/** One entry of a feed, the same in every format. */
export type FeedItem = {
  title: string
  /** The page or file the entry leads to, absolute; also its id. */
  link: string
  description?: string
  author?: string
  publishedAt: Date
}

/** A feed's data, written out by `createRssFeed` or `createJsonFeed`. */
export type Feed = {
  channel: FeedChannel
  items: FeedItem[]
}
