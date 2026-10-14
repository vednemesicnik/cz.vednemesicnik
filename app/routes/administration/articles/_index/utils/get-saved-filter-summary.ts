const alternatives = new Intl.ListFormat('cs', { type: 'disjunction' })

type SavedFilterSummaryOptions = {
  stateLabels: string[]
  query: string
  categoryNames: string[]
  tagNames: string[]
  authorNames: string[]
}

/**
 * The save dialog's lines on what a saved filter keeps (design 22d), one per
 * filter that differs from the default, its values whole and joined by „nebo“:
 * „Stav: Koncepty nebo Ke schválení“, „Hledání: „maturita““.
 *
 * @param options - The labels of the selected values per filter (empty for
 *   none) and the search `query` (`''` for none).
 * @returns The lines, or none when nothing would be saved.
 */
export const getSavedFilterSummary = ({
  stateLabels,
  query,
  categoryNames,
  tagNames,
  authorNames,
}: SavedFilterSummaryOptions): string[] => {
  const line = (label: string, values: string[]) =>
    values.length === 0 ? [] : [`${label}: ${alternatives.format(values)}`]

  return [
    ...line('Stav', stateLabels),
    ...(query === '' ? [] : [`Hledání: „${query}“`]),
    ...line('Rubrika', categoryNames),
    ...line('Štítek', tagNames),
    ...line('Autor', authorNames),
  ]
}
