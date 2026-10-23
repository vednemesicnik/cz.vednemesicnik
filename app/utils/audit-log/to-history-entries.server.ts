import type { AuditLogEvent } from '@generated/prisma/enums'

import { prisma } from '~/utils/db.server'

import {
  type AccountHistoryEntry,
  toAccountHistoryEntry,
} from './to-account-history-entry'

type AuditLogRow = {
  id: string
  actorId: string
  createdAt: Date
  event: AuditLogEvent
  detail: string | null
}

/**
 * Turns `AuditLog` rows into a detail's Historie, in their order (28b, 28e).
 * The actor's name is their author name; a deleted actor has none.
 *
 * @param rows - The rows, already ordered.
 * @returns The entries, without the rows no detail shows.
 */
export const toHistoryEntries = async (
  rows: AuditLogRow[],
): Promise<AccountHistoryEntry[]> => {
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
