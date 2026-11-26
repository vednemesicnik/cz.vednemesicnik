type Options = {
  page: number
  pageSize: number
}

/**
 * One page of a list ordered in memory, for orders SQLite can't give: it
 * compares bytes, which puts every capital before any small letter and Š after
 * Z. The caller's comparator decides the order, a Czech name included
 * (`nameCollator`).
 *
 * @param records - Every record the list matches, with the fields `compare` reads.
 * @param compare - The list's order, ties broken, as for `Array.prototype.sort`.
 * @returns The page's ids in order, and how many records the list matches.
 */
export const getOrderedPage = <Row extends { id: string }>(
  records: Row[],
  compare: (first: Row, second: Row) => number,
  { page, pageSize }: Options,
) => {
  const orderedIds = [...records].sort(compare).map((record) => record.id)

  return {
    pageIds: orderedIds.slice((page - 1) * pageSize, page * pageSize),
    totalCount: orderedIds.length,
  }
}
