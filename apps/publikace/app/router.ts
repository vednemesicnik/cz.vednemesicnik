import { compression } from 'remix/middleware/compression'
import { logger } from 'remix/middleware/logger'
import { staticFiles } from 'remix/middleware/static'
import { createRouter, type RouterContext } from 'remix/router'

import controller from './actions/controller.tsx'
import { serveAssets } from './middleware/assets.server.ts'
import { render } from './middleware/render.tsx'
import { routes } from './routes.ts'

export const router = createRouter({
  /*
   * Ordering matters:
   *   - `logger()` outermost, so what it reports is the status and duration the browser saw,
   *     a static file included,
   *   - `compression()` above the static files, because the stylesheet and the fonts are the
   *     largest things the app sends,
   *   - the fast exits next — `staticFiles()` and `serveAssets()` — so no file request ever
   *     reaches what will read a session,
   *   - `render()` last, so every controller has `context.render`.
   */
  middleware: [
    logger(),
    compression(),
    staticFiles('./public', { index: false }),
    serveAssets(),
    render(),
  ],
})

export type AppContext = RouterContext<typeof router>

declare module 'remix' {
  interface RouterTypes {
    context: AppContext
  }
}

router.map(routes, controller)
