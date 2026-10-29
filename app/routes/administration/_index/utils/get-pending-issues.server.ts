import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'
import { issueTitleSelect } from '~/utils/issue/issue-title-select'
import { resolveIssueTitles } from '~/utils/issue/resolve-issue-titles.server'
import { APPROVER_ROLE_LEVEL } from '~/utils/permissions/author/review-policy'

type GetPendingIssuesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
  /** The issues the viewer may see, so a supplement names only those. */
  visibleWhere: Prisma.IssueWhereInput
}

export async function getPendingIssues(options: GetPendingIssuesOptions) {
  const { currentAuthorId, currentRoleLevel, visibleWhere } = options

  // Waiting = submitted and not yet approved by an approver (design 07a, 07d);
  // approved content waits for its order, not for work, and leaves the queue.
  const where: Prisma.IssueWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    reviews: {
      none: { reviewer: { role: { level: { lte: APPROVER_ROLE_LEVEL } } } },
    },
    state: 'draft',
    submittedAt: { not: null },
  }

  const [items, count] = await Promise.all([
    prisma.issue.findMany({
      // Front of the queue first: a resubmitted item goes to the back.
      orderBy: { submittedAt: 'asc' },
      select: {
        author: { select: { name: true } },
        id: true,
        ...issueTitleSelect,
        submittedAt: true,
      },
      take: 5,
      where,
    }),
    prisma.issue.count({ where }),
  ])

  return { count, items: await resolveIssueTitles(items, visibleWhere) }
}
