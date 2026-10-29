type Options = {
  year: number | null
  order: number | null
  supplement: string | null
  hasCover: boolean
  hasPdf: boolean
  /** Whether another issue holds the number as published (log 0039). */
  isNumberTaken: boolean
}

export type IssueFixTarget = 'year' | 'order' | 'cover' | 'pdf' | 'supplement'

/**
 * Where *Upravit v editoru* opens the issue editor (design 26e, 6dlnv2de): at
 * the first thing the missing-content sentence names, in the order of
 * `getMissingIssueContent`, and at the field with a taken number's error when
 * nothing is missing — *Doplněk* for a supplement, *Pořadí v roce* otherwise.
 *
 * @param options - The issue's number, whether it has a cover and a PDF, and
 *   whether its number is taken.
 * @returns The field to focus; `null` when nothing is to fix.
 */
export const getIssueFixTarget = ({
  year,
  order,
  supplement,
  hasCover,
  hasPdf,
  isNumberTaken,
}: Options): IssueFixTarget | null => {
  if (year === null) return 'year'
  if (order === null) return 'order'
  if (!hasCover) return 'cover'
  if (!hasPdf) return 'pdf'
  if (isNumberTaken) return supplement === null ? 'order' : 'supplement'

  return null
}
