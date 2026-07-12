import { setInterval } from 'node:timers'
import { remember } from '@epic-web/remember'

import type { AuthLogEvent, AuthMethod } from '@generated/prisma/enums'
import { prisma } from '~/utils/db.server'
import { getClientIp } from '~/utils/rate-limit.server'

export type { AuthMethod }

type AuthLogBase = {
  request: Request
  userId?: string
  email?: string
}

// Discriminated on `event`: the sign-in events require a `method` (a row without
// one is incomplete), while `sign_out` has no method. This makes an incomplete
// call a compile-time error rather than a silent bad row.
type RecordAuthLogArgs =
  | (AuthLogBase & {
      event: Exclude<AuthLogEvent, 'sign_out'>
      method: AuthMethod
    })
  | (AuthLogBase & { event: 'sign_out'; method?: never })

// Retention window for auth logs (see cleanupOldAuthLogs).
const RETENTION_DAYS = 90

// How often the retention loop prunes once running (see startAuthLogRetention).
const RETENTION_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

/**
 * Writes an authentication log entry. Fire-and-forget: a logging failure must
 * never break sign-in / sign-out, so the Prisma call is not awaited and any
 * error is only console.error-ed.
 */
export const recordAuthLog = ({
  request,
  event,
  method,
  userId,
  email,
}: RecordAuthLogArgs): void => {
  void prisma.authLog
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
      console.error('Failed to record auth log', error)
    })
}

/**
 * Deletes auth logs older than the retention window. Fire-and-forget; driven by
 * startAuthLogRetention.
 */
export const cleanupOldAuthLogs = (): void => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  void prisma.authLog
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .catch((error: unknown) => {
      console.error('Failed to clean up old auth logs', error)
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
export const startAuthLogRetention = (): void => {
  remember('authLogRetention', () => {
    cleanupOldAuthLogs()
    return setInterval(
      cleanupOldAuthLogs,
      RETENTION_CLEANUP_INTERVAL_MS,
    ).unref()
  })
}
