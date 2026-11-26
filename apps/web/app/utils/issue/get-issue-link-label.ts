import type { NumberedIssueFields } from './get-issue-tile-labels'

// The main issue as a screen reader hears it (m18z9bn0): by the name with the
// year, or by the order spelled out.
const getSpokenIssue = (name: string | null, year: number, order: number) =>
  name ? `${name} ${year}` : `${order} z roku ${year}`

/**
 * The accessible name of an archive tile's link to its PDF (design 14a,
 * m18z9bn0, wo02u3xq).
 *
 * @param issue - A numbered issue: only those have a PDF to open.
 * @param mainIssueName - For a supplement, the name of its main issue, or
 *   `null` when the viewer can't see it or it has none.
 * @returns `podzim 2026, číslo 3, PDF`, `Číslo 1 z roku 2026, PDF`,
 *   `Maturitní ples, doplněk k číslu červen 2026, PDF` or
 *   `Maturitní ples, doplněk k číslu 2 z roku 2026, PDF`.
 */
export const getIssueLinkLabel = (
  { year, order, name, supplement }: NumberedIssueFields,
  mainIssueName: string | null = null,
): string => {
  if (supplement) {
    return `${supplement}, doplněk k číslu ${getSpokenIssue(mainIssueName, year, order)}, PDF`
  }

  return name
    ? `${name} ${year}, číslo ${order}, PDF`
    : `Číslo ${order} z roku ${year}, PDF`
}
