import { getIssueOrderLabel } from './get-issue-order-label'

export type IssueTitleFields = {
  /** `null` in a draft that has none yet (design 26e). */
  year: number | null
  order: number | null
  name: string | null
  supplement: string | null
}

// What a title without the year or the order says is missing (copy ey73zhul).
const getMissingPart = ({ year, order }: IssueTitleFields) => {
  if (year === null && order === null) return 'bez roku a pořadí'
  if (year === null) return 'bez roku'
  return 'bez pořadí'
}

/**
 * The issue's title, everywhere it is named (design 26a, 26c): the name with the
 * year, the order without a name. A supplement is named by its own name and the
 * issue it belongs to (wo02u3xq). A draft without the year or the order says
 * what it lacks (copy ey73zhul).
 *
 * @param issue - The issue's year, order, name (without the year) and supplement.
 * @param mainIssueName - For a supplement, the name of the main issue with the same
 *   year and order, or `null` when it doesn't exist, has no name or the viewer
 *   can't see it; the supplement then names it by its order.
 * @returns `podzim 2026`, `4/2026`, `Maturitní ples · doplněk k číslu červen 2026`
 *   or `Maturitní ples · doplněk k číslu 2/2026`; without a year or an order
 *   `podzim · bez roku`, `Číslo 2026 bez pořadí`, `Číslo bez roku a pořadí` or
 *   `Maturitní ples · doplněk bez pořadí`.
 */
export const getIssueTitle = (
  issue: IssueTitleFields,
  mainIssueName: string | null = null,
): string => {
  const { year, order, name, supplement } = issue

  if (supplement) {
    if (year === null || order === null) {
      return `${supplement} · doplněk ${getMissingPart(issue)}`
    }

    const mainIssueTitle = getIssueTitle({
      ...issue,
      name: mainIssueName,
      supplement: null,
    })
    return `${supplement} · doplněk k číslu ${mainIssueTitle}`
  }

  if (name) {
    return year === null
      ? `${name} · ${getMissingPart(issue)}`
      : `${name} ${year}`
  }

  const orderLabel = getIssueOrderLabel(issue)
  if (orderLabel !== null) return orderLabel

  return year === null
    ? `Číslo ${getMissingPart(issue)}`
    : `Číslo ${year} bez pořadí`
}
