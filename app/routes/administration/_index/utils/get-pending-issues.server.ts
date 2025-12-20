import type { Prisma } from '@generated/prisma/client'
import { prisma } from '~/utils/db.server'

type GetPendingIssuesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingIssues(options: GetPendingIssuesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.IssueWhereInput = {
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
    authorId: { not: currentAuthorId },
    state: 'draft',
  }

  const [items, count] = await Promise.all([
    prisma.issue.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        author: { select: { name: true } },
        createdAt: true,
        id: true,
        label: true,
      },
      take: 5,
      where,
    }),
    prisma.issue.count({ where }),
  ])

  return { count, items }
}
