/** Content whose own page the web can preview (10d). */
export type PreviewEntity =
  | 'article'
  | 'article_category'
  | 'article_tag'
  | 'podcast'
  | 'podcast_episode'

/**
 * What a public page shows the reader doesn't see (10d): a list with
 * outlined items, or a page that is itself unpublished content.
 */
export type PagePreview =
  | { kind: 'list' }
  | { kind: 'item'; entity: PreviewEntity; administrationPath: string }
