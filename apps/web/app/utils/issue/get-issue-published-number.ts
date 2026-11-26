/** The year, order and supplement slug that make an issue's number (26d). */
export type IssueNumberKey = {
  year: number
  order: number
  /** The supplement's slug, `''` for a main issue. */
  supplementSlug: string
}

/**
 * The number an issue holds once published (log 0039), the one unique value:
 * the year and the order, and a supplement's slug. Year and order are digits
 * only, so no two numbers give the same key, and it is the stem of the PDF's
 * name.
 *
 * @returns `2026-4`, or `2026-2-maturitni-ples`.
 */
export const getIssuePublishedNumber = ({
  year,
  order,
  supplementSlug,
}: IssueNumberKey): string =>
  supplementSlug === ''
    ? `${year}-${order}`
    : `${year}-${order}-${supplementSlug}`
