/**
 * The queues of an administration list's Stav filter (design 22a, 22i, 25a),
 * the values of `?state=`. A draft is a queue of unsubmitted drafts; `pending`
 * and `approved` are submitted drafts without and with an approving review
 * (07a); `submitted` is both, the Contributor's Odeslané.
 */
export const CONTENT_QUEUES = [
  'draft',
  'pending',
  'approved',
  'submitted',
  'published',
  'archived',
] as const

export type ContentQueue = (typeof CONTENT_QUEUES)[number]

export type QueueCount = {
  queue: ContentQueue
  count: number
}

/** The Stav menu's values, in its order (22a). */
export const STATE_FILTER_QUEUES = [
  'draft',
  'pending',
  'approved',
  'published',
  'archived',
] as const satisfies readonly ContentQueue[]

/** A Contributor approves nothing: Odeslané, waiting or approved (22i). */
export const CONTRIBUTOR_STATE_FILTER_QUEUES = [
  'draft',
  'submitted',
  'published',
  'archived',
] as const satisfies readonly ContentQueue[]

/** The queues the Stav menu counts: the work in progress (22d). */
export const COUNTED_QUEUES = [
  'draft',
  'pending',
  'approved',
] as const satisfies readonly ContentQueue[]

export const CONTRIBUTOR_COUNTED_QUEUES = [
  'draft',
  'submitted',
] as const satisfies readonly ContentQueue[]

export const CONTENT_QUEUE_LABELS: Record<ContentQueue, string> = {
  approved: 'Schválené',
  archived: 'Archivované',
  draft: 'Koncepty',
  pending: 'Ke schválení',
  published: 'Publikované',
  submitted: 'Odeslané',
}
