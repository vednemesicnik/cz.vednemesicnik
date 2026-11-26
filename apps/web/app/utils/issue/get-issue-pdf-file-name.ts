import {
  getIssuePublishedNumber,
  type IssueNumberKey,
} from './get-issue-published-number'

/**
 * The name a PDF gets at publish: its issue's published number (log 0039),
 * the year and the order, and a supplement's slug, never the name, so renaming
 * an issue keeps its address (design 26c). Before publish it is only the
 * provisional address (26j).
 *
 * @param supplementSlug - The supplement's slug, `''` for a main issue.
 * @returns `VDM-2026-4.pdf`, or `VDM-2026-2-maturitni-ples.pdf`.
 */
export const getIssuePdfFileName = (number: IssueNumberKey): string =>
  `VDM-${getIssuePublishedNumber(number)}.pdf`
