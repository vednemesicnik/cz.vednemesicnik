import type { Prisma } from '@generated/prisma/client'

import { prisma } from '~/utils/db.server'

import type { IssueTitleFields } from './get-issue-title'

/**
 * The names of the main issues the given supplements belong to, loaded in one
 * query and limited to those the viewer may see: a supplement never names a
 * draft its reader doesn't know of (design 26a, wo02u3xq). Of drafts sharing
 * the number, the issue that holds it as published names it (log 0039).
 *
 * @param issues - Issues selected with `issueTitleSelect`; main issues are skipped.
 * @param visibleWhere - The issues the viewer may see.
 * @returns The name by `year/order` (`2026/2`), `null` for a nameless main
 *   issue; a number missing from the map has no main issue the viewer may see.
 */
export const loadMainIssueNames = async (
  issues: IssueTitleFields[],
  visibleWhere: Prisma.IssueWhereInput,
): Promise<Map<string, string | null>> => {
  // A supplement without its number belongs to no main issue yet.
  const supplements = issues.flatMap(({ supplement, year, order }) =>
    supplement && year !== null && order !== null ? [{ order, year }] : [],
  )

  const mainIssueNames = new Map<string, string | null>()
  if (supplements.length === 0) return mainIssueNames

  const mainIssues = await prisma.issue.findMany({
    // The holder first, then a named draft: SQLite sorts nulls last when
    // descending.
    orderBy: [{ publishedNumber: 'desc' }, { name: 'desc' }],
    select: { name: true, order: true, year: true },
    where: {
      AND: [
        visibleWhere,
        {
          // Without a name too: a nameless holder names nothing.
          OR: supplements,
          supplementSlug: '',
        },
      ],
    },
  })

  for (const { year, order, name } of mainIssues) {
    const number = `${year}/${order}`
    if (!mainIssueNames.has(number)) mainIssueNames.set(number, name)
  }

  return mainIssueNames
}
