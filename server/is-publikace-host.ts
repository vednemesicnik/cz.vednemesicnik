// Publikace's domain, which Fly serves on its own certificate beside the web's, and its name
// on this computer, where it comes before the web's `*.localhost`.
const PUBLIKACE_HOSTS = new Set([
  'publikace.vednemesicnik.cz',
  'publikace.localhost',
])

/**
 * Whether this host belongs to Publikace rather than to the web.
 *
 * @param hostname The request URL's hostname, lower-case as `URL` gives it.
 * @returns `true` for Publikace's hosts.
 */
export function isPublikaceHost(hostname: string): boolean {
  return PUBLIKACE_HOSTS.has(hostname)
}
