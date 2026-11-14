import type { Middleware } from 'remix/router'

import { assetServer } from '../assets.ts'

/**
 * Serves the built client modules and the design system's files, above everything that will
 * read a session.
 *
 * A page pulls its whole module graph at once, dozens of requests in parallel, and a file has
 * no session. Below `session()`, every one of them would read the session store and write it
 * back, and one failed module import takes an island's whole graph down with it — the race
 * `cz.vednemesicnik.billing`'s `app/middleware/assets.server.ts` describes.
 */
export function serveAssets(): Middleware {
  return async (context, next) => {
    // `null` for anything outside the asset server's base path, which is every page.
    return (await assetServer.fetch(context.request)) ?? next()
  }
}
