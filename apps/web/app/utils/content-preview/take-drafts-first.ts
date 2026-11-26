/**
 * The first items of a date-ordered list with every draft on top, as if it
 * were published now (10d).
 *
 * @param drafts - The drafts, newest save first.
 * @param rest - The published and archived items, newest publication first.
 * @param count - How many items the list shows.
 * @returns At most `count` items, drafts first.
 */
export const takeDraftsFirst = <Item>(
  drafts: Item[],
  rest: Item[],
  count: number,
) => [...drafts, ...rest].slice(0, count)
