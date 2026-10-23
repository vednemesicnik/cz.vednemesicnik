import type { Prisma } from '@generated/prisma/client'

import { prisma } from '~/utils/db.server'

import { getIssueTitle, type IssueTitleFields } from './get-issue-title'

/** The fields {@link resolveIssueTitles} needs; spread into an issue's `select`. */
export const issueTitleSelect = {
  name: true,
  order: true,
  supplement: true,
  year: true,
} as const satisfies Prisma.IssueSelect

/**
 * Adds each issue's `title`. A supplement is named after its main issue, so the
 * main issues of the supplements among them are loaded in one query, limited to
 * those the viewer may see: a supplement never names a draft its reader doesn't
 * know of; it names it by the order instead (design 26a, wo02u3xq). Of drafts
 * sharing the number, the issue that holds it as published names it (log 0039).
 *
 * @param issues - Issues selected with {@link issueTitleSelect}.
 * @param visibleWhere - The issues the viewer may see.
 * @returns The issues, each with its `title`.
 */
export const resolveIssueTitles = async <Issue extends IssueTitleFields>(
  issues: Issue[],
  visibleWhere: Prisma.IssueWhereInput,
): Promise<(Issue & { title: string })[]> => {
  // A supplement without its number belongs to no main issue yet.
  const supplements = issues.flatMap(({ supplement, year, order }) =>
    supplement && year !== null && order !== null ? [{ order, year }] : [],
  )

  const mainIssues =
    supplements.length === 0
      ? []
      : await prisma.issue.findMany({
          // The holder first: SQLite sorts nulls last when descending.
          orderBy: { publishedNumber: 'desc' },
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

  const mainIssueNames = new Map<string, string | null>()
  for (const { year, order, name } of mainIssues) {
    const number = `${year}/${order}`
    if (!mainIssueNames.has(number)) mainIssueNames.set(number, name)
  }

  return issues.map((issue) => ({
    ...issue,
    title: getIssueTitle(
      issue,
      issue.supplement
        ? (mainIssueNames.get(`${issue.year}/${issue.order}`) ?? null)
        : null,
    ),
  }))
}
