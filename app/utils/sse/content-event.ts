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

/**
 * An id-only hint that a piece of content changed. Receivers revalidate their own
 * loaders, so the event carries no data and needs no permission filtering.
 */
export type ContentEvent = {
  entity: ContentEventEntity
  entityId: string
  change: ContentEventChange
}
