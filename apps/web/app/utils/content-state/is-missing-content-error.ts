import type { MissingContentError } from './create-missing-content-error'

/**
 * Whether a caught value is the missing content a publish write found
 * (`createMissingContentError`).
 *
 * @param error - The caught value.
 */
export const isMissingContentError = (
  error: unknown,
): error is MissingContentError =>
  error instanceof Error &&
  'missing' in error &&
  Array.isArray((error as MissingContentError).missing)
