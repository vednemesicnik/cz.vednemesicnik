/**
 * The issue's order in its year, as it stands beside the title (design 26a).
 *
 * @returns `4/2026`, or `null` for a draft without the year or the order.
 */
export const getIssueOrderLabel = ({
  year,
  order,
}: {
  year: number | null
  order: number | null
}): string | null =>
  year === null || order === null ? null : `${order}/${year}`
