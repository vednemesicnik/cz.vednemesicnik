type Item = {
  name: string
  slug: string
}

/**
 * The names of a row's categories or tags, the filtered ones first, so the row
 * shows why it is in the list (22a); the rest keep their order.
 *
 * @param selectedSlugs - The slugs the list is filtered by, or `undefined`
 *   when it isn't.
 * @returns The names, filtered first.
 */
export const orderFilteredFirst = (
  items: Item[],
  selectedSlugs: string[] | undefined,
) => {
  const isSelected = (item: Item) => selectedSlugs?.includes(item.slug) ?? false

  return [
    ...items.filter(isSelected),
    ...items.filter((item) => !isSelected(item)),
  ].map((item) => item.name)
}
