import { createId, isCuid } from '@paralleldrive/cuid2'

/**
 * The length of every key: `createId()`'s default, and the length
 * `20261211120000_cuid_row_ids` gives the rows that were there before it.
 */
const KEY_LENGTH = 24

/**
 * The shape of a form key a page drawn before #1135's release can still send, accepted until
 * #1140 refuses it.
 */
const UUID_FORM_KEY = /^[0-9a-f-]{36}$/

/**
 * A new random key, a CUID: a row's ID, a form key, a run key, a Drive tag, a multipart
 * boundary. Every key the app makes comes from here.
 */
export function newKey(): string {
  return createId()
}

/** Whether a value from an address, a form, a cookie or a payload has the shape of a key. */
export function isKey(value: unknown): value is string {
  return (
    typeof value === 'string' && isCuid(value, { minLength: KEY_LENGTH, maxLength: KEY_LENGTH })
  )
}

/**
 * Whether a value a page sent can be its form key. A UUID passes too, because a page drawn
 * before #1135's release keeps its key until it is posted, and the artwork page has already
 * tied its uploads to that key.
 */
export function isFormKey(value: unknown): value is string {
  return isKey(value) || (typeof value === 'string' && UUID_FORM_KEY.test(value))
}
