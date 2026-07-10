import { remember } from '@epic-web/remember'

import { prisma } from '~/utils/db.server'
import { getClientIp } from '~/utils/rate-limit.server'

export type AuthEventName =
  | 'sign_in_success'
  | 'sign_in_failure'
  | 'two_factor_failure'
  | 'sign_out'

export type AuthMethod =
  | 'password'
  | 'magic_link'
  | 'google'
  | 'passkey'
  | 'two_factor'
  | 'backup_code'

type RecordAuthEventArgs = {
  request: Request
  event: AuthEventName
  method?: AuthMethod
  userId?: string
  email?: string
}

// Retention window for auth events (see cleanupOldAuthEvents).
const RETENTION_DAYS = 90

// How often the retention loop prunes once running (see startAuthEventRetention).
const RETENTION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * Writes an authentication audit event. Fire-and-forget: a logging failure must
 * never break sign-in / sign-out, so the Prisma call is not awaited and any
 * error is only console.error-ed.
 */
export const recordAuthEvent = ({
  request,
  event,
  method,
  userId,
  email,
}: RecordAuthEventArgs): void => {
  void prisma.authEvent
    .create({
      data: {
        email,
        event,
        ipAddress: getClientIp(request),
        method,
        userAgent: request.headers.get('User-Agent') ?? undefined,
        userId,
      },
    })
    .catch((error: unknown) => {
      console.error('Failed to record auth event', error)
    })
}

/**
 * Deletes auth events older than the retention window. Fire-and-forget; driven
 * by startAuthEventRetention.
 */
export const cleanupOldAuthEvents = (): void => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  void prisma.authEvent
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .catch((error: unknown) => {
      console.error('Failed to clean up old auth events', error)
    })
}

/**
 * Starts the retention loop: prune once now, then daily. No cron mechanism
 * exists, so this runs in-process; min_machines_running keeps a process alive so
 * the interval fires reliably, and .unref() lets the process exit without
 * waiting on it. remember() guards against duplicate registration when the
 * calling module is re-evaluated (e.g. dev HMR), so exactly one interval exists
 * per process. Called once from entry.server.
 */
export const startAuthEventRetention = (): void => {
  remember('authEventRetention', () => {
    cleanupOldAuthEvents()
    return setInterval(
      cleanupOldAuthEvents,
      RETENTION_CLEANUP_INTERVAL_MS,
    ).unref()
  })
}
