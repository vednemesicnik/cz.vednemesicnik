const alternatives = new Intl.ListFormat('cs', { type: 'disjunction' })

type SavedFilterSummaryOptions = {
  filters: { label: string; valueLabels: string[] }[]
  query: string
}

/**
 * The save dialog's lines on what a saved filter keeps (design 22d), one per
 * filter that differs from the default, its values whole and joined by „nebo“:
 * „Stav: Koncepty nebo Ke schválení“, „Hledání: „maturita““. The search
 * follows the first filter, as the filter row reads.
 *
 * @param options - The `filters` in the order of the filter row, each with
 *   the labels of its selected values (empty for none), and the search
 *   `query` (`''` for none).
 * @returns The lines, or none when nothing would be saved.
 */
export const getSavedFilterSummary = ({
  filters,
  query,
}: SavedFilterSummaryOptions): string[] => {
  const lines = filters.flatMap(({ label, valueLabels }) =>
    valueLabels.length === 0
      ? []
      : [`${label}: ${alternatives.format(valueLabels)}`],
  )
  const searchLine = query === '' ? [] : [`Hledání: „${query}“`]
  const firstFilter = filters[0]
  const isFirstFilterSet =
    firstFilter !== undefined && firstFilter.valueLabels.length > 0

  return isFirstFilterSet
    ? [lines[0], ...searchLine, ...lines.slice(1)]
    : [...searchLine, ...lines]
}
