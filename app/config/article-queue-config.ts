/**
 * The article list's queues (design 22a, 22i), the values of `?state=`. A draft
 * is a queue of unsubmitted drafts; `pending` and `approved` are submitted drafts
 * without and with an approving review (07a); `submitted` is both, the
 * Contributor's Odeslané.
 */
export const ARTICLE_QUEUES = [
  'draft',
  'pending',
  'approved',
  'submitted',
  'published',
  'archived',
] as const

export type ArticleQueue = (typeof ARTICLE_QUEUES)[number]
