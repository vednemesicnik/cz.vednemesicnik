/**
 * Whether one address lies above another in the address hierarchy, which is
 * the one the links up follow (design 11b): `/articles` above
 * `/articles/a-slug`, a detail above its `/edit`. The home page lies above
 * nothing, since no page links up to it.
 *
 * @param ancestorPathname - The address that may lie above.
 * @param pathname - The current page's address.
 * @returns `true` when `pathname` is under `ancestorPathname`.
 */
export const isAncestorPath = (ancestorPathname: string, pathname: string) =>
  ancestorPathname !== '/' && pathname.startsWith(`${ancestorPathname}/`)
