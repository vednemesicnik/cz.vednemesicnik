import type { Middleware } from 'remix/router'

import { AppAssets, type Assets } from '../assets.ts'

/**
 * Serves the built client modules and the design system's files, above everything that will
 * read a session, and leaves the assets in the context for the page shell.
 *
 * A page pulls its whole module graph at once, dozens of requests in parallel, and a file has
 * no session. Below `session()`, every one of them would read the session store and write it
 * back, and one failed module import takes an island's whole graph down with it — the race
 * `cz.vednemesicnik.billing`'s `app/middleware/assets.server.ts` describes.
 */
export function serveAssets(assets: Assets): Middleware {
  return async (context, next) => {
    context.set(AppAssets, assets)
    // `null` for anything outside the asset server's base path, which is every page.
    return (await assets.server.fetch(context.request)) ?? next()
  }
}
