/**
 * Turns a site path into the absolute address a feed reader needs.
 *
 * @param path - A path from `href()`, optionally with a fragment.
 * @returns The address on `BASE_URL`.
 *
 * @example
 * toAbsoluteUrl('/articles') // 'https://vednemesicnik.cz/articles'
 */
export const toAbsoluteUrl = (path: string) =>
  new URL(path, process.env.BASE_URL).href
