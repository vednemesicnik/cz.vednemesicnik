/**
 * The name a new PDF is stored under: the year and the order, and a supplement's
 * slug, never the name, so renaming an issue keeps its address (design 26c).
 *
 * @param supplementSlug - The supplement's slug, `''` for a main issue.
 * @returns `VDM-2026-4.pdf`, or `VDM-2026-2-maturitni-ples.pdf`.
 */
export const getIssuePdfFileName = ({
  year,
  order,
  supplementSlug,
}: {
  year: number
  order: number
  supplementSlug: string
}): string =>
  supplementSlug === ''
    ? `VDM-${year}-${order}.pdf`
    : `VDM-${year}-${order}-${supplementSlug}.pdf`
