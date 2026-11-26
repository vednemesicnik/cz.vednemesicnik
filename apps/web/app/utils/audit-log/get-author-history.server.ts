import { prisma } from '~/utils/db.server'

import type { AccountHistoryEntry } from './to-account-history-entry'
import { toHistoryEntries } from './to-history-entries.server'

/**
 * Reads an author's history from `AuditLog`, newest first (design 28b): its
 * creation and its author role changes, by the author's id. An author created
 * before the log has no creation entry; its date stands under the name.
 *
 * @param authorId - The author's id.
 * @returns The entries, ready for the detail's Historie.
 */
export const getAuthorHistory = async (
  authorId: string,
): Promise<AccountHistoryEntry[]> => {
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
      event: { in: ['author_created', 'author_role_changed'] },
      targetId: authorId,
    },
  })

  return toHistoryEntries(rows)
}
