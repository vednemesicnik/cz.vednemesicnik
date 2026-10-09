import { nameCollator } from './name-collator'

/**
 * Picks the items with the most articles and orders them by name, as the
 * category row on `/articles` and the tag strip on the category index show
 * them (design 11a, 11c). A tie at the cut is broken by name.
 *
 * @param items - Items with a name and their visible article count.
 * @param limit - How many to keep.
 * @returns At most `limit` items, ordered by name (Czech collation).
 */
export const pickTopByArticleCount = <
  Item extends { articleCount: number; name: string },
>(
  items: Item[],
  limit: number,
): Item[] => {
  const byName = (first: Item, second: Item) =>
    nameCollator.compare(first.name, second.name)

  return [...items]
    .sort(
      (first, second) =>
        second.articleCount - first.articleCount || byName(first, second),
    )
    .slice(0, limit)
    .sort(byName)
}
