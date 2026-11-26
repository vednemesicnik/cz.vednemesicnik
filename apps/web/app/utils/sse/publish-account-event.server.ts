import type { AccountEvent } from './account-event'
import { broadcaster } from './broadcaster.server'

/**
 * Tells every open administration stream that a user or an author changed.
 * Fire-and-forget: a failure is only logged and never reaches the action.
 *
 * @param event - Which account changed and how.
 */
export const publishAccountEvent = (
  event: Omit<AccountEvent, 'occurredAt'>,
): void => {
  try {
    const accountEvent: AccountEvent = {
      change: event.change,
      entity: event.entity,
      entityId: event.entityId,
      occurredAt: new Date().toISOString(),
    }

    broadcaster.publish('admin', {
      data: JSON.stringify(accountEvent),
      event: 'account-change',
    })
  } catch (error) {
    console.error('Failed to publish an account event', error)
  }
}
