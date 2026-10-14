import { prisma } from '~/utils/db.server'

import {
  type AccountHistoryEntry,
  toAccountHistoryEntry,
} from './to-account-history-entry'

/**
 * Reads an account's history from `AuditLog`, newest first (design 28e): its
 * creation, user role changes and emergency links issued for it by the user
 * id, author role changes by the
 * id of the author that belongs to the account. The actor's name is their
 * author name; a deleted actor has none.
 *
 * @param account.userId - The account's user id.
 * @param account.authorId - The id of the account's author.
 * @returns The entries, ready for the detail's Historie.
 */
export const getAccountHistory = async ({
  userId,
  authorId,
}: {
  userId: string
  authorId: string
}): Promise<AccountHistoryEntry[]> => {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      actorId: true,
      createdAt: true,
      detail: true,
      event: true,
      id: true,
    },
    where: {
      OR: [
        {
          event: {
            in: ['user_created', 'user_role_changed', 'emergency_link_issued'],
          },
          targetId: userId,
        },
        { event: 'author_role_changed', targetId: authorId },
      ],
    },
  })

  const actors = await prisma.user.findMany({
    select: { author: { select: { name: true } }, id: true },
    where: { id: { in: [...new Set(rows.map((row) => row.actorId))] } },
  })
  const actorNames = new Map(
    actors.map((actor) => [actor.id, actor.author.name]),
  )

  return rows.flatMap(
    (row) =>
      toAccountHistoryEntry(row, actorNames.get(row.actorId) ?? null) ?? [],
  )
}
