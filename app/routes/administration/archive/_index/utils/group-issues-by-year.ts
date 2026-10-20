type YearGroup<Issue> = {
  year: number | null
  issues: Issue[]
}

/**
 * The list's rows under their year (design 26a), in the order they come: each
 * page starts with its first year again. Rows without a year, drafts that have
 * none yet, form a group of their own.
 *
 * @param issues - One page of issues, ordered by year and order.
 * @returns A group per run of rows with the same year, in order.
 */
export const groupIssuesByYear = <Issue extends { year: number | null }>(
  issues: Issue[],
): YearGroup<Issue>[] =>
  issues.reduce<YearGroup<Issue>[]>((groups, issue) => {
    const lastGroup = groups.at(-1)

    if (lastGroup?.year === issue.year) {
      lastGroup.issues.push(issue)
    } else {
      groups.push({ issues: [issue], year: issue.year })
    }

    return groups
  }, [])
