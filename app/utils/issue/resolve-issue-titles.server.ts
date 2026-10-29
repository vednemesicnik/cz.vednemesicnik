import type { Prisma } from '@generated/prisma/client'

import { getIssueTitle, type IssueTitleFields } from './get-issue-title'
import { loadMainIssueNames } from './load-main-issue-names.server'

/**
 * Adds each issue's `title`. A supplement is named after its main issue, which
 * `loadMainIssueNames` loads for the viewer; it names it by the order when the
 * viewer can't see it (design 26a, wo02u3xq).
 *
 * @param issues - Issues selected with `issueTitleSelect`.
 * @param visibleWhere - The issues the viewer may see.
 * @returns The issues, each with its `title`.
 */
export const resolveIssueTitles = async <Issue extends IssueTitleFields>(
  issues: Issue[],
  visibleWhere: Prisma.IssueWhereInput,
): Promise<(Issue & { title: string })[]> => {
  const mainIssueNames = await loadMainIssueNames(issues, visibleWhere)

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
