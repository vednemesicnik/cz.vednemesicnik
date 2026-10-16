/**
 * Moves one item of a list to another position, leaving the input unchanged.
 *
 * @param items - The list.
 * @param from - The item's current index.
 * @param to - Its new index, clamped to the list.
 * @returns A new list with the item at `to`.
 */
export const moveListItem = <Item>(
  items: Item[],
  from: number,
  to: number,
): Item[] => {
  const target = Math.max(0, Math.min(to, items.length - 1))

  if (from === target || from < 0 || from >= items.length) return [...items]

  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item)

  return next
}
