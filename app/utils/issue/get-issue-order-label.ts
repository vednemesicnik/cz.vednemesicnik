/**
 * The issue's order in its year, as it stands beside the title (design 26a).
 *
 * @returns `4/2026`.
 */
export const getIssueOrderLabel = ({
  year,
  order,
}: {
  year: number
  order: number
}): string => `${order}/${year}`
