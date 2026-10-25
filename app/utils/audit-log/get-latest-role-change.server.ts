import { prisma } from '~/utils/db.server'
import { formatNumericDateTime } from '~/utils/format-numeric-date-time'

type Options = {
  event: 'author_role_changed' | 'user_role_changed'
  targetId: string
  roleName: string
}

type RoleChange = {
  actorName: string
  changedAt: string
}

/**
 * Who changed a role last and when, for the role version check's
 * „Změna: …“ line (design 28c, 28f; lj22mnbm). The actor's name is their
 * author name, as in the detail's Historie.
 *
 * @param options.event - The role-change event of the record.
 * @param options.targetId - The author's or user's id, as the event records it.
 * @param options.roleName - The stored role the change has to have ended on.
 * @returns The actor's name and the moment in Prague time, or `null` when the
 *   newest row did not end on the stored role (a change made outside the app,
 *   or one whose row is not written yet), when there is no row, or when its
 *   actor is gone.
 */
export const getLatestRoleChange = async ({
  event,
  targetId,
  roleName,
}: Options): Promise<RoleChange | null> => {
  const row = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { actorId: true, createdAt: true, detail: true },
    where: { event, targetId },
  })

  // An older change would name the wrong person (`role: from → to`).
  if (row === null || row.detail?.endsWith(` → ${roleName}`) !== true) {
    return null
  }

  const actor = await prisma.user.findUnique({
    select: { author: { select: { name: true } } },
    where: { id: row.actorId },
  })

  if (actor === null) return null

  return {
    actorName: actor.author.name,
    changedAt: formatNumericDateTime(row.createdAt),
  }
}
