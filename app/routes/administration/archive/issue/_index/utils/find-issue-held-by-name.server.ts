import { prisma } from '~/utils/db.server'
import { getEditHoldStatus } from '~/utils/edit-hold/get-edit-hold-status'

/**
 * Who else holds the issue's edit hold now (design 07g), for a refused
 * transition's „Číslo právě upravuje …“ (copy zuq3hyhf).
 *
 * @param id - The issue.
 * @param authorId - The acting author; their own hold doesn't count.
 * @returns The holder's name, or `null` when the issue is free, the author's
 *   own or gone.
 */
export const findIssueHeldByName = async (id: string, authorId: string) => {
  const issue = await prisma.issue.findUnique({
    select: {
      heldByAuthor: { select: { name: true } },
      heldByAuthorId: true,
      heldByTabId: true,
      heldSince: true,
      heldUntil: true,
    },
    where: { id },
  })

  if (issue === null) return null

  return getEditHoldStatus(issue, { authorId, now: new Date() }) === 'other'
    ? (issue.heldByAuthor?.name ?? null)
    : null
}
