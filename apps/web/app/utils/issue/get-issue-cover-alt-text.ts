import { getIssueTitle, type IssueTitleFields } from './get-issue-title'

/**
 * The cover's alt text, composed from the title; the editors don't write it
 * (design 26c, qjv38ti4).
 *
 * @returns `Obálka čísla podzim 2026`, or `Obálka doplňku Maturitní ples`.
 */
export const getIssueCoverAltText = (issue: IssueTitleFields): string =>
  issue.supplement
    ? `Obálka doplňku ${issue.supplement}`
    : `Obálka čísla ${getIssueTitle(issue)}`
