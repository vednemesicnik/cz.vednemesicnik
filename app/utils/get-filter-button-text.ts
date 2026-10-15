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
 * @param description - Read after the name and values, e.g. the count the
 *   Stav button shows (22d): „na schválení čekají celkem 2 články“.
 * @returns `values` — what the button shows after the name, `''` for none;
 *   `more` — „+N“, kept visible when `values` is truncated, `''` for none;
 *   `accessibleName` — the name with every value, for screen readers.
 */
export const getFilterButtonText = (
  label: string,
  valueLabels: string[],
  description?: string,
): FilterButtonText => {
  const named =
    valueLabels.length === 0 ? label : `${label}: ${valueLabels.join(', ')}`
  const accessibleName =
    description === undefined ? named : `${named}, ${description}`

  if (valueLabels.length === 0) {
    return { accessibleName, more: '', values: '' }
  }

  if (valueLabels.length <= 2) {
    return { accessibleName, more: '', values: valueLabels.join(', ') }
  }

  return {
    accessibleName,
    more: `+${valueLabels.length - 1}`,
    values: valueLabels[0],
  }
}
