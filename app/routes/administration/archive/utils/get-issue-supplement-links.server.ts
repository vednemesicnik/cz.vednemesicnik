import type { Prisma } from '@generated/prisma/client'

import { prisma } from '~/utils/db.server'
import { getIssueOrderLabel } from '~/utils/issue/get-issue-order-label'
import { getIssueTitle } from '~/utils/issue/get-issue-title'

type Issue = {
  year: number | null
  order: number | null
  supplement: string | null
}

export type IssueSupplementLinks =
  | { kind: 'supplements'; supplements: { id: string; label: string }[] }
  | {
      kind: 'main-issue'
      mainIssue: { id: string; title: string } | null
      orderLabel: string | null
    }

/**
 * What an issue's details link to (design 26b, qjv38ti4): a main issue to its
 * supplements, a supplement to the issue with the same year and order. Only
 * issues the viewer may see are named (wo02u3xq).
 *
 * @param issue - The issue's year, order and supplement.
 * @param visibleWhere - The issues the viewer may see.
 * @returns For a main issue, its supplements by name; for a supplement, its
 *   main issue by title, or `null` when it doesn't exist or the viewer can't
 *   see it, with the order label to show instead.
 */
export const getIssueSupplementLinks = async (
  issue: Issue,
  visibleWhere: Prisma.IssueWhereInput,
): Promise<IssueSupplementLinks> => {
  const { year, order } = issue

  // Without its number an issue belongs with no other yet.
  if (year === null || order === null) {
    return issue.supplement
      ? { kind: 'main-issue', mainIssue: null, orderLabel: null }
      : { kind: 'supplements', supplements: [] }
  }

  if (issue.supplement) {
    const mainIssue = await prisma.issue.findFirst({
      select: { id: true, name: true, order: true, year: true },
      where: { AND: [visibleWhere, { order, supplementSlug: '', year }] },
    })

    return {
      kind: 'main-issue',
      mainIssue:
        mainIssue === null
          ? null
          : {
              id: mainIssue.id,
              title: getIssueTitle({ ...mainIssue, supplement: null }),
            },
      orderLabel: getIssueOrderLabel(issue),
    }
  }

  const supplements = await prisma.issue.findMany({
    // By the slug, as the archive orders supplements (log 0030).
    orderBy: { supplementSlug: 'asc' },
    select: { id: true, supplement: true },
    where: {
      AND: [visibleWhere, { order, supplementSlug: { not: '' }, year }],
    },
  })

  return {
    kind: 'supplements',
    supplements: supplements.map(({ id, supplement }) => ({
      id,
      label: supplement ?? '',
    })),
  }
}
