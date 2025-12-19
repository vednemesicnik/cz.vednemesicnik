import type { Prisma } from "@generated/prisma/client"
import { prisma } from "~/utils/db.server"

type GetPendingIssuesOptions = {
  currentAuthorId: string
  currentRoleLevel: number
}

export async function getPendingIssues(options: GetPendingIssuesOptions) {
  const { currentAuthorId, currentRoleLevel } = options

  const where: Prisma.IssueWhereInput = {
    state: "draft",
    authorId: { not: currentAuthorId },
    author:
      currentRoleLevel === 1
        ? undefined
        : { role: { level: { gt: currentRoleLevel } } },
  }

  const [items, count] = await Promise.all([
    prisma.issue.findMany({
      where,
      select: {
        id: true,
        label: true,
        createdAt: true,
        author: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.issue.count({ where }),
  ])

  return { items, count }
}
