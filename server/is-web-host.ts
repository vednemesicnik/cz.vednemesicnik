import { isPublikaceHost } from './is-publikace-host.ts'

// The hosts that reach the web on Fly: the domain, its www (both behind Cloudflare) and the
// origin itself, which the deploy smoke test calls.
const PRODUCTION_HOSTS = new Set([
  'vednemesicnik.cz',
  'www.vednemesicnik.cz',
  'cz-vednemesicnik.fly.dev',
])

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Whether the web answers this host: a production host, or one on this computer, where a
 * `*.localhost` name gives a test session a cookie jar of its own, Publikace's excepted.
 *
 * @param hostname The request URL's hostname, lower-case as `URL` gives it.
 * @returns `true` for the web's hosts.
 */
export function isWebHost(hostname: string): boolean {
  if (isPublikaceHost(hostname)) return false

  return (
    PRODUCTION_HOSTS.has(hostname) ||
    LOCAL_HOSTS.has(hostname) ||
    hostname.endsWith('.localhost')
  )
}
