import { createAssetServer } from 'remix/assets'
import { componentHmr } from 'remix/component-hmr/assets'

const rootDir = process.cwd()
const nodeEnv = process.env.NODE_ENV ?? 'development'
const isDevelopment = nodeEnv === 'development'
const isProduction = nodeEnv === 'production'
const isHmr = Boolean(isDevelopment && process.env.REMIX_NODE_HMR)

export const assetServer = createAssetServer({
  basePath: '/assets',
  rootDir,
  /*
   * The boundary between server code and the browser. Inside `app/`, a `public/` directory is
   * the whole of what a browser may fetch, so everything else there — controllers, the
   * database, auth — is server-only by being where it is. `denyFiles` takes back what
   * `public/**` would otherwise hand over: a `.server.` module an island imported by mistake,
   * and a test sitting beside the code it tests.
   */
  allowFiles: ['app/routes.ts', 'app/**/public/**'],
  allowPackages: ['remix'],
  denyFiles: ['**/*.server.*', 'app/**/*.test.*'],
  /*
   * The design system's stylesheet pulls its two font files through `url()`, and the pages
   * behind a shared link name its share image for a messenger's preview (`02c`). A leaf file is
   * served only when its extension is listed.
   */
  files: { extensions: ['.woff2', '.jpg'] },
  sourceMaps: isDevelopment ? 'external' : undefined,
  minify: !isDevelopment,
  fingerprint: isProduction,
  /*
   * Production serves files that never move, and `remix test` runs with `NODE_ENV=test`, which
   * is what keeps the suite from leaving a watcher behind.
   */
  watch: isDevelopment,
  hmr: isHmr
    ? {
        channel: async () => (await import('remix/node-hmr/runtime')).createBrowserHmrChannel(),
        moduleImporter: 'remix/multiple-import-maps-polyfill',
      }
    : undefined,
  scripts: { loaders: isHmr ? [componentHmr()] : undefined },
})

/**
 * The browser runtime's entry: its URL and the import map its graph resolves through. The
 * document carries the map even on a page with no island, because the entry itself imports
 * `remix/component` bare.
 */
export const scriptEntry = await assetServer.getScriptEntry('app/actions/public/entry.ts')

/**
 * The magazine's design system, tokens and components, from the pinned copy beside it.
 * `@import` and `url()` inside it are rewritten to asset URLs, so one link carries the fonts
 * too.
 */
export const stylesheetHref = await assetServer.getHref('app/ui/public/ds/styles.css')

/** The design system's share image, which a messenger shows under a shared link (`02c`). */
export const shareImageHref = await assetServer.getHref('app/ui/public/ds/assets/og-share.jpg')
