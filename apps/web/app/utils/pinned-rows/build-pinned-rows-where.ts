/**
 * The rows a live load asks for, within what the role may view (design 22f):
 * the ids come from the browser, so the permission clause always stays.
 *
 * @param permissionWhere - The list's permission clause.
 * @param pinnedIds - The rows on screen (`parsePinnedRowIds`).
 * @returns A Prisma `where` for exactly those rows the role may view.
 */
export const buildPinnedRowsWhere = <Where>(
  permissionWhere: Where,
  pinnedIds: string[],
) => ({ AND: [permissionWhere, { id: { in: pinnedIds } }] })
