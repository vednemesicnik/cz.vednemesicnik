/**
 * The moves of an ordered row's „⋯“ (design 22c, 27d): only the steps that
 * change something, and *Na začátek* / *Na konec* only where they differ
 * from one step. The alternative to dragging (WCAG 2.5.7).
 *
 * @param index - The row's place.
 * @param count - How many rows the order has.
 * @param moveTo - Moves the row to a place.
 * @returns The `ActionMenu` items, none for a single row.
 */
export const getOrderMenuItems = (
  index: number,
  count: number,
  moveTo: (target: number) => void,
) => [
  ...(index > 0
    ? [{ label: 'Posunout nahoru', onSelect: () => moveTo(index - 1) }]
    : []),
  ...(index < count - 1
    ? [{ label: 'Posunout dolů', onSelect: () => moveTo(index + 1) }]
    : []),
  ...(index > 1 ? [{ label: 'Na začátek', onSelect: () => moveTo(0) }] : []),
  ...(index < count - 2
    ? [{ label: 'Na konec', onSelect: () => moveTo(count - 1) }]
    : []),
]
