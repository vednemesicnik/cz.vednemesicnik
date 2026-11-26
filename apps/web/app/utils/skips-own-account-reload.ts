const hasFlag = (match: unknown) =>
  typeof match === 'object' &&
  match !== null &&
  'handle' in match &&
  typeof match.handle === 'object' &&
  match.handle !== null &&
  'skipsOwnAccountReload' in match.handle &&
  match.handle.skipsOwnAccountReload === true

/**
 * Whether the page stays out of the reload on an event about one's own account
 * (log 0042): an editor under an edit hold, which must not revalidate once its
 * hold is lost or its content deleted (logs 0023, 0036). A route says so with
 * `handle.skipsOwnAccountReload`.
 *
 * @param matches - The route matches.
 */
export const skipsOwnAccountReload = (matches: unknown[]): boolean =>
  matches.some(hasFlag)
