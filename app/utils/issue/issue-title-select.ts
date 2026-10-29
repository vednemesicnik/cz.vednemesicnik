import type { Prisma } from '@generated/prisma/client'

/** The fields `resolveIssueTitles` needs; spread into an issue's `select`. */
export const issueTitleSelect = {
  name: true,
  order: true,
  supplement: true,
  year: true,
} as const satisfies Prisma.IssueSelect
