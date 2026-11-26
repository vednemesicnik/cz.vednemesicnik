// Types only, server-free, so the client hook can import them.

export type ContentEventEntity =
  | 'article'
  | 'issue'
  | 'podcast'
  | 'podcast_episode'
  | 'podcast_episode_link'
  | 'article_tag'
  | 'article_category'

export type ContentEventChange =
  | 'review'
  | 'publish'
  | 'retract'
  | 'archive'
  | 'restore'
  | 'delete'
  | 'change-published-at'
  | 'submission'
  | 'create'
  | 'update'
  // The edit hold was taken, taken over or released (log 0019).
  | 'hold'

/** The author whose action changed the content. */
export type ContentEventActor = {
  authorId: string
  name: string
}

/**
 * A hint that a piece of content changed. Receivers revalidate their own
 * loaders, so the event carries no content and needs no permission filtering;
 * only who changed it and when, for the live change in the article list (22f).
 */
export type ContentEvent = {
  entity: ContentEventEntity
  entityId: string
  change: ContentEventChange
  actor: ContentEventActor
  /** ISO 8601 */
  occurredAt: string
}
