type Box = { left: number; top: number; width: number; height: number }

/**
 * The tile under a point, among the gallery's tiles laid out as they stand.
 *
 * @param tiles - The candidate tiles with their boxes.
 * @param x - The point's horizontal position, in the boxes' coordinates.
 * @param y - Its vertical position.
 * @returns The tile's id, or `null` in a gap or outside the grid.
 */
export const findTileAtPoint = (
  tiles: { id: string; box: Box }[],
  x: number,
  y: number,
): string | null =>
  tiles.find(
    ({ box }) =>
      x >= box.left &&
      x < box.left + box.width &&
      y >= box.top &&
      y < box.top + box.height,
  )?.id ?? null
