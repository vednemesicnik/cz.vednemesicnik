type IssuesOfYear<Issue> = {
  year: number
  issues: Issue[]
}

/**
 * Groups issues under their year for the archive's year headings (design 14a),
 * keeping the order they come in. A year without an issue gets no group.
 *
 * @param issues - Issues already ordered by year, newest first.
 * @returns One group per year, in the issues' order.
 */
export const groupIssuesByYear = <Issue extends { year: number }>(
  issues: Issue[],
): IssuesOfYear<Issue>[] => {
  const years: IssuesOfYear<Issue>[] = []

  for (const issue of issues) {
    const lastYear = years.at(-1)

    if (lastYear?.year === issue.year) {
      lastYear.issues.push(issue)
    } else {
      years.push({ issues: [issue], year: issue.year })
    }
  }

  return years
}
