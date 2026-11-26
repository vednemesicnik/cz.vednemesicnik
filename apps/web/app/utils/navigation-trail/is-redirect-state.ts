/**
 * Whether a location is where a redirect landed: React Router marks it with
 * `_isRedirect` in its navigation state.
 *
 * @param state - The location's navigation state.
 * @returns `true` for a redirect's landing.
 */
export const isRedirectState = (state: unknown) =>
  typeof state === 'object' &&
  state !== null &&
  '_isRedirect' in state &&
  state._isRedirect === true
