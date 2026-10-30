/**
 * The domain an episode link shows on its card under *Kde poslouchat* (13c):
 * the host without `www.`.
 *
 * @param url - The stored address; a draft in preview may hold an invalid one.
 * @returns `open.spotify.com`, or `null` when the address doesn't parse.
 */
export const formatLinkHost = (url: string): string | null => {
  if (!URL.canParse(url)) return null

  return new URL(url).hostname.replace(/^www\./, '')
}
