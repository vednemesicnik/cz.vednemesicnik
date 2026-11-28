import { createId, isCuid } from '@paralleldrive/cuid2'

/**
 * The length of every row ID: `createId()`'s default, and the length
 * `20261211120000_cuid_row_ids` gives the rows that were there before it.
 */
const ROW_ID_LENGTH = 24

/** A new row's ID, a CUID the app makes and passes in the `INSERT` (`docs/migrations.md`). */
export function newRowId(): string {
  return createId()
}

/**
 * Whether a value from an address, a form or a job's payload can be a row ID. It says nothing
 * about whether the row exists: the store answers that, and a lookup that finds nothing is
 * refused like a malformed ID.
 */
export function isRowId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    isCuid(value, { minLength: ROW_ID_LENGTH, maxLength: ROW_ID_LENGTH })
  )
}
