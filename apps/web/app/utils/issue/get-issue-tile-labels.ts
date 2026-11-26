import { getIssueOrderLabel } from './get-issue-order-label'
import { getIssueTitle } from './get-issue-title'

export type NumberedIssueFields = {
  year: number
  order: number
  name: string | null
  supplement: string | null
}

type IssueTileLabels = {
  label: string
  sublabel: string | null
}

/**
 * The two lines under an archive tile (design 14a): the name with the year and
 * the smaller order under it, or only the order without a name. A supplement
 * carries its own name and the issue it belongs to (wo02u3xq).
 *
 * @param issue - A numbered issue: only those have a PDF to open.
 * @param mainIssueName - For a supplement, the name of its main issue, or
 *   `null` when the viewer can't see it or it has none; it is then named by
 *   the order.
 * @returns `podzim 2026` / `3/2026`, `4/2026` / `null`, or `Maturitní ples` /
 *   `doplněk k číslu červen 2026` (`doplněk k číslu 2/2026`).
 */
export const getIssueTileLabels = (
  issue: NumberedIssueFields,
  mainIssueName: string | null = null,
): IssueTileLabels => {
  if (issue.supplement) {
    const mainIssueTitle = getIssueTitle({
      ...issue,
      name: mainIssueName,
      supplement: null,
    })
    return {
      label: issue.supplement,
      sublabel: `doplněk k číslu ${mainIssueTitle}`,
    }
  }

  return {
    label: getIssueTitle(issue),
    sublabel: issue.name ? getIssueOrderLabel(issue) : null,
  }
}
