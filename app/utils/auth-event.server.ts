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
 * Deletes auth events older than the retention window. Fire-and-forget; called
 * on server startup and on a daily interval (see entry.server.tsx).
 */
export const cleanupOldAuthEvents = (): void => {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

  void prisma.authEvent
    .deleteMany({ where: { createdAt: { lt: cutoff } } })
    .catch((error: unknown) => {
      console.error('Failed to clean up old auth events', error)
    })
}
