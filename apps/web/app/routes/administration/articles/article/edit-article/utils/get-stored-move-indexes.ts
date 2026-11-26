/**
 * Where a stored image moves in the gallery's list when it goes to another
 * place among the stored images: it takes the place of the stored image it
 * passes, and an image still uploading or failed keeps its tile where it is.
 *
 * @param ids - Every tile, in the gallery's order.
 * @param storedIds - The stored images among them, in the same order.
 * @param id - The stored image that moves.
 * @param to - Its new place among the stored images.
 * @returns The list indexes to move from and to, or `null` when nothing moves.
 */
export const getStoredMoveIndexes = (
  ids: string[],
  storedIds: string[],
  id: string,
  to: number,
): { from: number; to: number } | null => {
  const storedFrom = storedIds.indexOf(id)
  if (
    storedFrom === -1 ||
    to === storedFrom ||
    to < 0 ||
    to >= storedIds.length
  ) {
    return null
  }

  return { from: ids.indexOf(id), to: ids.indexOf(storedIds[to]) }
}
