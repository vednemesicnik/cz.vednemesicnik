// Types only, server-free, so the client hook can import them.

export type AccountEventEntity = 'user' | 'author'

export type AccountEventChange = 'create' | 'update' | 'delete'

/**
 * A hint that a user or an author changed. Receivers revalidate their own
 * loaders, so the event carries no account data and needs no permission
 * filtering. Unlike a content event it names no actor: no page shows one, and
 * an account's display name may be its e-mail address (log 0042).
 */
export type AccountEvent = {
  entity: AccountEventEntity
  entityId: string
  change: AccountEventChange
  /** ISO 8601 */
  occurredAt: string
}
