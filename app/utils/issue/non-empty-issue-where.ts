import type { Prisma } from '@generated/prisma/client'

/**
 * Issues that have been saved or have had a file uploaded. An empty draft
 * (decisions 0020, 0032) is left out of every list, count and preview until
 * then.
 */
export const NON_EMPTY_ISSUE_WHERE = {
  firstContentAt: { not: null },
} satisfies Prisma.IssueWhereInput
