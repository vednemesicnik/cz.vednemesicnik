import type { AccountEvent } from './account-event'

export type OwnAccount = {
  userId: string
  authorId: string
}

/**
 * Tells whether an account event is about the signed-in account: its user or
 * its author.
 *
 * @param event - The account event.
 * @param account - The signed-in account's user and author ids.
 */
export const isOwnAccountEvent = (
  event: AccountEvent,
  account: OwnAccount,
): boolean =>
  (event.entity === 'user' && event.entityId === account.userId) ||
  (event.entity === 'author' && event.entityId === account.authorId)
