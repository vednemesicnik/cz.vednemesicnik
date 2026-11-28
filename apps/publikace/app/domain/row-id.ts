/**
 * Two row IDs in a fixed order, the last tie-break of a sort. A CUID says nothing about when its
 * row was written, so a sort that means "the older first" says so by a time before it gets here.
 */
export function compareIds(a: string, b: string): number {
  if (a === b) return 0
  return a < b ? -1 : 1
}
