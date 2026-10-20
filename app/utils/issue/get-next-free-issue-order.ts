/**
 * The order a new issue gets in its year (design 26c): the one after the last
 * main issue, so a gap left by a deleted issue is not filled in. *Použít 4* in
 * 26d offers the same.
 *
 * @param takenOrders - The orders of the year's main issues.
 * @returns The highest order plus one, or 1 in a year without issues.
 */
export const getNextFreeIssueOrder = (takenOrders: readonly number[]): number =>
  takenOrders.reduce((highest, order) => Math.max(highest, order), 0) + 1
