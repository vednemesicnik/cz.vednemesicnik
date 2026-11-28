/**
 * A fixed row ID for a test that needs one it did not insert: a row a fake store holds, or an ID
 * nobody issued. `c` and the number padded to 24 characters, so `isRowId()` accepts it and two
 * numbers never meet.
 */
export function testRowId(n: number): string {
  return `c${String(n).padStart(23, '0')}`
}
