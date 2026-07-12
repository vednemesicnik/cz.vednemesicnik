import { prisma } from '~/utils/db.server'
import { getClientIp } from '~/utils/rate-limit.server'

export { formatRoleChangeDetail } from '~/utils/format-role-change-detail'

type AuditLogBase = {
  request: Request
  actorId: string // user id of the administrator performing the action
  targetId: string // user id (or author id for author_role_changed) of the affected account
}

// Discriminated on `event`: role-change events require a `detail` describing the
// change, while create/delete carry none. This makes an incomplete call a
// compile-time error rather than a silent bad row.
type RecordAuditLogArgs =
  | (AuditLogBase & { event: 'user_created' | 'user_deleted'; detail?: never })
  | (AuditLogBase & {
      event: 'user_role_changed' | 'author_role_changed'
      detail: string
    })

/**
 * Writes an administrative audit log entry. Fire-and-forget: a logging failure
 * must never break the underlying mutation, so the Prisma call is not awaited and
 * any error is only console.error-ed. No retention loop — audit records are kept
 * indefinitely.
 */
export const recordAuditLog = ({
  request,
  event,
  actorId,
  targetId,
  detail,
}: RecordAuditLogArgs): void => {
  void prisma.auditLog
    .create({
      data: {
        actorId,
        detail,
        event,
        ipAddress: getClientIp(request),
        targetId,
      },
    })
    .catch((error: unknown) => {
      console.error('Failed to record audit log', error)
    })
}
