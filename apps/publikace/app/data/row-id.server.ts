import { isKey, newKey } from './key.server.ts'

/** A new row's ID, a CUID the app makes and passes in the `INSERT` (`docs/migrations.md`). */
export function newRowId(): string {
  return newKey()
}

/**
 * Whether a value from an address, a form or a job's payload can be a row ID. It says nothing
 * about whether the row exists: the store answers that, and a lookup that finds nothing is
 * refused like a malformed ID.
 */
export function isRowId(value: unknown): value is string {
  return isKey(value)
}
