import { constants } from 'node:zlib'
import { compression } from '@remix-run/compression-middleware'
import { createRouter } from '@remix-run/fetch-router'
import { type LoggerFunction, logger } from '@remix-run/logger-middleware'
import { staticFiles } from '@remix-run/static-middleware'

import { addDefaultCharset } from './add-default-charset.ts'
import type { FetchHandler } from './create-web-handler.ts'
import { isPublikaceHost } from './is-publikace-host.ts'
import { refuseUnknownHost } from './refuse-unknown-host.ts'

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const REVALIDATE_CACHE_CONTROL = 'public, max-age=0'

const isFingerprintedAsset = (relativePath: string) =>
  relativePath.startsWith('assets/')

type HostHandlerOptions = {
  clientDirectory: string
  log?: LoggerFunction
  publikaceHandler?: FetchHandler
  webHandler: FetchHandler
}

/**
 * Creates the host's request handler: Publikace for its hosts, and in front of the web app
 * what `react-router-serve` did.
 *
 * A request for one of Publikace's hosts goes to Publikace as it came, since Publikace
 * compresses, serves its files and logs by itself. Of the rest, a host the web doesn't answer
 * gets 404 before anything else. Fingerprinted files under
 * `/assets` are cached for a year, the rest of the client build revalidates, everything
 * compressible is compressed, and only requests that reach the web app are logged, as morgan
 * logged them, though without the query.
 *
 * @param options.clientDirectory The web's client build (`apps/web/build/client`).
 * @param options.log Where access-log lines go; `console.log` when left out.
 * @param options.publikaceHandler Publikace, for its hosts; without it they get 404.
 * @param options.webHandler The web app, for every request no static file answers.
 * @returns The handler the Node server calls for each request.
 */
export function createHostHandler({
  clientDirectory,
  log,
  publikaceHandler,
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
      refuseUnknownHost,
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

  return (request) =>
    publikaceHandler && isPublikaceHost(new URL(request.url).hostname)
      ? publikaceHandler(request)
      : router.fetch(request)
}
