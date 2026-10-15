/**
 * Narrows a record to one with an address. The public queries already ask for
 * `slug: { not: null }` (a draft without one has no page, decision 0020); the
 * filter makes the type say so.
 *
 * @param item - A record whose slug may be null.
 * @returns True when it has a slug.
 */
export const hasSlug = <Item extends { slug: string | null }>(
  item: Item,
): item is Item & { slug: string } => item.slug !== null
