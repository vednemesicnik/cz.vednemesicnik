/**
 * Puts freshly loaded rows back in the order they stand on screen (22f): a row
 * keeps its place whatever the new sort or filters say. A row the load no
 * longer returns (deleted, or no longer visible to the reader) drops out.
 *
 * @param pinnedIds - The ids of the rows on screen, in their order.
 * @param rows - The fresh rows, in any order.
 * @returns The fresh rows in the order of `pinnedIds`.
 */
export const orderPinnedRows = <Row extends { id: string }>(
  pinnedIds: string[],
  rows: Row[],
): Row[] => {
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  return pinnedIds.flatMap((id) => {
    const row = rowsById.get(id)
    return row === undefined ? [] : [row]
  })
}
