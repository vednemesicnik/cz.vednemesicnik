/**
 * The labels of a filter's selected values, in menu order, for the save
 * dialog's summary (design 22d).
 *
 * @param options - The filter's options.
 * @param values - The selected values, `undefined` for none.
 * @returns The labels of the selected options.
 */
export const getOptionLabels = (
  options: { value: string; label: string }[],
  values: string[] | undefined,
): string[] =>
  options
    .filter((option) => values?.includes(option.value) ?? false)
    .map((option) => option.label)
