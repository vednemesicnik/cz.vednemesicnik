import { getIssueOrderLabel } from './get-issue-order-label'

export type IssueTitleFields = {
  year: number
  order: number
  name: string | null
  supplement: string | null
}

/**
 * The issue's title, everywhere it is named (design 26a, 26c): the name with the
 * year, the order without a name. A supplement is named by its own name and the
 * issue it belongs to (wo02u3xq).
 *
 * @param issue - The issue's year, order, name (without the year) and supplement.
 * @param mainIssueName - For a supplement, the name of the main issue with the same
 *   year and order, or `null` when it doesn't exist, has no name or the viewer
 *   can't see it; the supplement then names it by its order.
 * @returns `podzim 2026`, `4/2026`, `Maturitní ples · doplněk k číslu červen 2026`
 *   or `Maturitní ples · doplněk k číslu 2/2026`.
 */
export const getIssueTitle = (
  issue: IssueTitleFields,
  mainIssueName: string | null = null,
): string => {
  if (issue.supplement) {
    const mainIssueTitle = getIssueTitle({
      ...issue,
      name: mainIssueName,
      supplement: null,
    })
    return `${issue.supplement} · doplněk k číslu ${mainIssueTitle}`
  }

  return issue.name ? `${issue.name} ${issue.year}` : getIssueOrderLabel(issue)
}
