import { getTakenIssueNumberItem } from '../../../utils/get-taken-issue-number-item'

const listFormat = new Intl.ListFormat('cs', { type: 'conjunction' })

type Options = {
  year: number | null
  order: number | null
  supplement: string | null
  hasCover: boolean
  hasPdf: boolean
  /** Whether another issue holds the number as published (log 0039). */
  isNumberTaken: boolean
}

/**
 * What an issue still lacks before it can be submitted, approved or published
 * (design 26e, copy qjv38ti4): the year, the order, the cover and the PDF, in
 * one sentence; the name and the supplement are not required. A number another
 * issue holds follows as a sentence of its own (copy q34nuf6c).
 *
 * @param options - The issue's number, whether it has a cover and a PDF, and
 *   whether its number is taken.
 * @returns E.g. „Chybí obálka a PDF.“ and „Číslo 3/2026 je obsazené.“; empty
 *   when complete.
 */
export const getMissingIssueContent = ({
  year,
  order,
  supplement,
  hasCover,
  hasPdf,
  isNumberTaken,
}: Options): string[] => {
  const missing: string[] = []

  if (year === null) missing.push('rok')
  if (order === null) missing.push('pořadí v roce')
  if (!hasCover) missing.push('obálka')
  if (!hasPdf) missing.push('PDF')

  return [
    ...(missing.length === 0 ? [] : [`Chybí ${listFormat.format(missing)}.`]),
    // Only a whole number can be taken.
    ...(isNumberTaken && year !== null && order !== null
      ? [getTakenIssueNumberItem({ order, supplement, year })]
      : []),
  ]
}
