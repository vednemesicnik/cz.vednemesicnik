const hasFlag = (match: unknown) =>
  typeof match === 'object' &&
  match !== null &&
  'handle' in match &&
  typeof match.handle === 'object' &&
  match.handle !== null &&
  'hasOwnMobileBar' in match.handle &&
  match.handle.hasOwnMobileBar === true

/**
 * Whether the page brings its own bar on a phone, in place of the
 * administration's top bar and breadcrumbs: a Document editor's *Zavřít* and
 * save line (design 24f). A route says so with `handle.hasOwnMobileBar`.
 *
 * @param matches - The route matches.
 */
export const hasOwnMobileBar = (matches: unknown[]): boolean =>
  matches.some(hasFlag)
