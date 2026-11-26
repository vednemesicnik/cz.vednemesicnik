/**
 * Reads the key of the remembered list a link up returns to from a location's
 * navigation state (`ReturnState`).
 *
 * @param state - The location's navigation state.
 * @returns The key, or `null` when the navigation was no return.
 */
export const readReturnTo = (state: unknown) =>
  typeof state === 'object' &&
  state !== null &&
  'returnTo' in state &&
  typeof state.returnTo === 'string'
    ? state.returnTo
    : null
