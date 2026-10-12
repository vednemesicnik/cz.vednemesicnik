type SavedFilterSummaryOptions = {
  queueLabel: string | undefined
  query: string
  categoryName: string | undefined
  tagName: string | undefined
  authorName: string | undefined
}

/**
 * The save dialog's sentence on what a saved filter keeps (design 22d), e.g.
 * „Uloží se: Koncepty, hledání „maturita“, rubrika Škola, autor Marie
 * Horáková.“ Vše is no choice, so it is left out.
 *
 * @param options - The pill's label (`undefined` for Vše), the search `query`
 *   (`''` for none) and the names of the active filters.
 * @returns The sentence, or `''` when nothing would be saved.
 */
export const getSavedFilterSummary = ({
  queueLabel,
  query,
  categoryName,
  tagName,
  authorName,
}: SavedFilterSummaryOptions): string => {
  const parts = [
    queueLabel,
    query === '' ? undefined : `hledání „${query}“`,
    categoryName === undefined ? undefined : `rubrika ${categoryName}`,
    tagName === undefined ? undefined : `štítek ${tagName}`,
    authorName === undefined ? undefined : `autor ${authorName}`,
  ].filter((part) => part !== undefined)

  if (parts.length === 0) return ''

  const list = parts.join(', ')

  // A name may end with its own period („Vedneměsíčník, z. s.“).
  return `Uloží se: ${list}${list.endsWith('.') ? '' : '.'}`
}
