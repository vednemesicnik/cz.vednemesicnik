const listFormat = new Intl.ListFormat('cs', { type: 'conjunction' })

type Options = {
  year: number | null
  order: number | null
  hasCover: boolean
  /** The issue's PDF, `null` without one. */
  pdf: { fileName: string | null } | null
}

/**
 * What an issue still lacks before it can be submitted for review or published
 * (design 26e, copy qjv38ti4): the year, the order, the cover and the PDF, in
 * one sentence; the name and the supplement are not required. A PDF without a
 * name has no address yet (log 0033). With the year and the order there,
 * another PDF holds its name (copy di9tlre3).
 *
 * @param options - The issue's year and order, whether it has a cover, and its PDF.
 * @returns One sentence, e.g. „Chybí rok, pořadí v roce, obálka a PDF.“; empty
 *   when complete.
 */
export const getMissingIssueContent = ({
  year,
  order,
  hasCover,
  pdf,
}: Options): string[] => {
  const missing: string[] = []

  if (year === null) missing.push('rok')
  if (order === null) missing.push('pořadí v roce')
  if (!hasCover) missing.push('obálka')
  if (pdf === null) missing.push('PDF')

  // Without the year or the order the name waits for them, said above.
  if (
    year !== null &&
    order !== null &&
    pdf !== null &&
    pdf.fileName === null
  ) {
    return [
      missing.length === 0
        ? 'Adresu PDF už používá jiné číslo.'
        : // Bound to the next word with a no-break space, as the list joins.
          `Chybí ${listFormat.format(missing)} a adresu PDF už používá jiné číslo.`,
    ]
  }

  return missing.length === 0 ? [] : [`Chybí ${listFormat.format(missing)}.`]
}
