import { fileURLToPath } from 'node:url'
import { type AssetServer, createAssetServer } from 'remix/assets'
import { componentHmr } from 'remix/component-hmr/assets'
import { getContext } from 'remix/middleware/async-context'
import { createContextKey } from 'remix/router'

import type { Environment } from './auth/environment.server.ts'

/*
 * The repository, whichever directory the process was started in: a host that runs the app beside
 * its own serves these files from here, not from its working directory.
 */
const ROOT_DIR = fileURLToPath(new URL('..', import.meta.url))

type ScriptEntry = Awaited<ReturnType<AssetServer['getScriptEntry']>>

/** The asset server and the addresses every page links to. */
export type Assets = {
  close(): Promise<void>
  /**
   * The browser runtime's entry: its URL and the import map its graph resolves through. The
   * document carries the map even on a page with no island, because the entry itself imports
   * `remix/component` bare.
   */
  scriptEntry: ScriptEntry
  server: AssetServer
  /** The design system's share image, which a messenger shows under a shared link (`02c`). */
  shareImageHref: string
  /**
   * The magazine's design system, tokens and components, from the pinned copy beside it.
   * `@import` and `url()` inside it are rewritten to asset URLs, so one link carries the fonts
   * too.
   */
  stylesheetHref: string
}

/** The app's assets on this request, which `serveAssets()` puts there for the page shell. */
export const AppAssets = createContextKey<Assets>()

/** The assets of the app answering the request being drawn. */
export function requestAssets(): Assets {
  let assets = getContext().get(AppAssets)
  if (assets === undefined) throw new Error('serveAssets() must run before a page is drawn.')
  return assets
}

/**
 * Builds the asset server and the entry and stylesheet every page links to. Called once per
 * running app; `close()` stops the watcher it keeps outside production and tests.
 */
export async function createAssets(environment: Environment): Promise<Assets> {
  let nodeEnv = environment.NODE_ENV ?? 'development'
  let isDevelopment = nodeEnv === 'development'
  let isProduction = nodeEnv === 'production'
  let isHmr = Boolean(isDevelopment && environment.REMIX_NODE_HMR)

  let server = createAssetServer({
    basePath: '/assets',
    rootDir: ROOT_DIR,
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

  try {
    return {
      close: () => server.close(),
      scriptEntry: await server.getScriptEntry('app/actions/public/entry.ts'),
      server,
      shareImageHref: await server.getHref('app/ui/public/ds/assets/og-share.jpg'),
      stylesheetHref: await server.getHref('app/ui/public/ds/styles.css'),
    }
  } catch (error) {
    await server.close()
    throw error
  }
}
