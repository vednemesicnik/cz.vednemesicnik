type FilterButtonText = {
  accessibleName: string
  values: string
  more: string
}

/**
 * The text of a filter button (design 22d): its name alone, or with the
 * values — „Rubrika: Škola“, „Rubrika: Škola, Sport“, from three values the
 * first one and the number of the others, „Štítek: maturita +2“.
 *
 * @param label - The filter's name, e.g. „Rubrika“.
 * @param valueLabels - The selected values' labels in menu order.
 * @returns `values` — what the button shows after the name, `''` for none;
 *   `more` — „+N“, kept visible when `values` is truncated, `''` for none;
 *   `accessibleName` — the name with every value, for screen readers.
 */
export const getFilterButtonText = (
  label: string,
  valueLabels: string[],
): FilterButtonText => {
  if (valueLabels.length === 0) {
    return { accessibleName: label, more: '', values: '' }
  }

  const accessibleName = `${label}: ${valueLabels.join(', ')}`

  if (valueLabels.length <= 2) {
    return { accessibleName, more: '', values: valueLabels.join(', ') }
  }

  return {
    accessibleName,
    more: `+${valueLabels.length - 1}`,
    values: valueLabels[0],
  }
}
