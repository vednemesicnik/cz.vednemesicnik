/**
 * Extracts a printable message from an unknown thrown value. Meant for server logs
 * and development diagnostics only — never render the result to users.
 *
 * @param error - Any thrown value.
 * @returns The string itself, the `message` of an error-like object, or `'Unknown error'`.
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error

  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }

  return 'Unknown error'
}
