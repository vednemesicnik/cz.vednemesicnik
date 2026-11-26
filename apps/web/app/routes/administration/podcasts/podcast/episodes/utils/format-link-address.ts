/**
 * A link's address as the episode's detail shows it beside the platform
 * (design 27c): without the scheme and `www.`, so it starts with what tells
 * the platforms apart. The rest is cut by the card's ellipsis.
 *
 * @param url - The stored address; a draft may hold one that isn't valid
 *   (2o0uwhgp).
 * @returns `open.spotify.com/episode/4kQ…`, or the address as stored when it
 *   isn't a valid one.
 */
export const formatLinkAddress = (url: string): string => {
  if (!URL.canParse(url)) return url

  const { hostname, pathname, search, hash } = new URL(url)
  const path = pathname === '/' ? '' : pathname

  return `${hostname.replace(/^www\./, '')}${path}${search}${hash}`
}
