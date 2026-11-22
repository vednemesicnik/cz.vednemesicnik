import { constants } from 'node:zlib'
import { compression } from 'remix/middleware/compression'
import { type LoggerFunction, logger } from 'remix/middleware/logger'
import { staticFiles } from 'remix/middleware/static'
import { createRouter } from 'remix/router'

import { addDefaultCharset } from './add-default-charset.ts'
import type { FetchHandler } from './create-web-handler.ts'

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const REVALIDATE_CACHE_CONTROL = 'public, max-age=0'

const isFingerprintedAsset = (relativePath: string) =>
  relativePath.startsWith('assets/')

type HostHandlerOptions = {
  clientDirectory: string
  log?: LoggerFunction
  webHandler: FetchHandler
}

/**
 * Creates the host's request handler: what `react-router-serve` did in front of the web app.
 *
 * Fingerprinted files under `/assets` are cached for a year, the rest of the client build
 * revalidates, everything compressible is compressed, and only requests that reach the web
 * app are logged, as morgan logged them, though without the query.
 *
 * @param options.clientDirectory The client build (`build/client`).
 * @param options.log Where access-log lines go; `console.log` when left out.
 * @param options.webHandler The web app, for every request no static file answers.
 * @returns The handler the Node server calls for each request.
 */
export function createHostHandler({
  clientDirectory,
  log,
  webHandler,
}: HostHandlerOptions): FetchHandler {
  const router = createRouter({
    defaultHandler: async ({ request }) =>
      addDefaultCharset(await webHandler(request)),
    middleware: [
      // Brotli at quality 4, Express's default: Node's own is 11, too costly per
      // request on one shared CPU.
      compression({
        brotli: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } },
      }),
      staticFiles(clientDirectory, {
        cacheControl: IMMUTABLE_CACHE_CONTROL,
        filter: isFingerprintedAsset,
        index: false,
      }),
      staticFiles(clientDirectory, {
        cacheControl: REVALIDATE_CACHE_CONTROL,
        index: false,
      }),
      // The pathname without the query: sign-in and enrolment links carry their token
      // there, and morgan wrote it to the Fly log (log 0066).
      logger({
        colors: false,
        format: '%method %pathname %status %contentLength - %duration ms',
        log,
      }),
    ],
  })

  return (request) => router.fetch(request)
}
