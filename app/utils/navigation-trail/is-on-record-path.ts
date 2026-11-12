import { isAncestorPath } from './is-ancestor-path'

/**
 * Whether a page of the trail belongs to the way to and around the current
 * one: a page above it (its list, its detail) or below it (its edit page),
 * since memory goes between a record's detail and its edit page, Zavřít
 * included (design 30i, n3wa2ld4). A sibling, as another article, does not.
 *
 * @param entryPathname - The trail page's address.
 * @param pathname - The current page's address.
 * @returns `true` for a page above or below the current one.
 */
export const isOnRecordPath = (entryPathname: string, pathname: string) =>
  isAncestorPath(entryPathname, pathname) ||
  isAncestorPath(pathname, entryPathname)
