import type { ErrorResponse } from 'react-router'

/**
 * Builds a value that `isRouteErrorResponse` accepts, for tests and stories.
 *
 * @param status - The HTTP status.
 * @param data - The thrown data.
 * @returns A route error response shaped like the one React Router hands a boundary.
 */
export const createRouteErrorResponse = (
  status: number,
  data: unknown = null,
): ErrorResponse & { internal: boolean } => ({
  data,
  internal: false,
  status,
  statusText: '',
})
