import type { Middleware } from 'remix/router'

/**
 * The pages behind a shared link (`/l/{key}/…`) are public: nobody signs in, and the page sets no
 * cookie (`02a`). So the session, the sign-in and the CSRF token, which lives in the session, do
 * not run for them at all; a session middleware that ran would answer with a cookie.
 *
 * What protects the form instead is what an anonymous form can use: the key in the address, the
 * form's one-time key, and the limit of thirty sends an hour from one link. The artworks' upload
 * endpoint has the same and its own cap, sixty stored files an hour from one link, counted before
 * a body is read. A forged cross-site send gains nothing a direct one would not, because there is
 * no sign-in to ride on.
 *
 * Of those, the key is the one whoever holds it can use from anywhere, so a log line names the
 * page without it (`/l/…/article`), as `request-log.server.ts` writes it.
 */

const PUBLIC_LINK_PREFIX = '/l/'

export function isPublicLinkPath(pathname: string): boolean {
  return pathname.startsWith(PUBLIC_LINK_PREFIX)
}

/** The path with a shared link's key replaced by `…`; any other path as it is. */
export function withoutLinkKey(pathname: string): string {
  if (!isPublicLinkPath(pathname)) return pathname
  let rest = pathname.slice(PUBLIC_LINK_PREFIX.length)
  let slash = rest.indexOf('/')
  return `${PUBLIC_LINK_PREFIX}…${slash === -1 ? '' : rest.slice(slash)}`
}

/** Runs `middleware` for every request except those to a shared link. */
export function skipForPublicLinks<T extends Middleware<any>>(middleware: T): T {
  let skipping: Middleware<any> = (context, next) =>
    isPublicLinkPath(context.url.pathname) ? next() : middleware(context, next)
  return skipping as T
}

/**
 * `noindex` on every answer to a shared link, the page and its errors alike, so a link that
 * leaked to the web is not found through a search engine (`02a`). `no-store`, so a phone's
 * browser does not keep the form, the addresses in it included.
 */
export function publicLinkHeaders(): Middleware {
  return async (context, next) => {
    let response = await next()
    if (!isPublicLinkPath(context.url.pathname)) return response
    let headers = new Headers(response.headers)
    headers.set('X-Robots-Tag', 'noindex, nofollow')
    headers.set('Cache-Control', 'no-store')
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  }
}
