import { createContextKey, type Middleware } from 'remix/router'

import type { DriveAccountStore } from '../data/drive-account.server.ts'
import type { ConnectionRefusal } from '../domain/drive-account.ts'

/** The Drive account's store and the one address it may be. Read with `context.get(DriveAccount)`. */
export type DriveAccountContext = {
  /** `publikace.app@…`, lower-cased: the only account a connection accepts. */
  expectedEmail: string
  store: DriveAccountStore
}

export const DriveAccount = createContextKey<DriveAccountContext>()

/**
 * Handed in rather than built here, like the access list, so a test runs on its own database and
 * its own expected account.
 */
export function loadDriveAccount(
  driveAccount: DriveAccountContext,
): Middleware<{ key: typeof DriveAccount; property: 'driveAccount'; value: DriveAccountContext }> {
  return (context, next) => {
    context.set(DriveAccount, driveAccount)
    return next()
  }
}

/**
 * Session key holding why the last return from Google was refused, for the Callout in the card
 * (`14h`). In the session and not in the URL, because it can name the refused address.
 */
const CONNECT_RESULT_SESSION_KEY = 'driveConnectResult'

type SessionLike = {
  flash(key: string, value: unknown): void
  get(key: string): unknown
  unset(key: string): void
}

export function flashConnectRefusal(session: SessionLike, refusal: ConnectionRefusal): void {
  session.flash(CONNECT_RESULT_SESSION_KEY, refusal)
}

/**
 * Takes the refusal the previous request left, once. Cleared here, before the page streams, for
 * the reason `takeToasts()` gives.
 */
export function takeConnectRefusal(session: SessionLike | undefined): ConnectionRefusal | null {
  let value = session?.get(CONNECT_RESULT_SESSION_KEY)
  if (value === undefined) return null
  session?.unset(CONNECT_RESULT_SESSION_KEY)
  return isRefusal(value) ? value : null
}

function isRefusal(value: unknown): value is ConnectionRefusal {
  if (typeof value !== 'object' || value === null) return false
  let reason = (value as { reason?: unknown }).reason
  if (reason === 'wrong-account') return typeof (value as { email?: unknown }).email === 'string'
  return reason === 'failed' || reason === 'no-drive-scope'
}
