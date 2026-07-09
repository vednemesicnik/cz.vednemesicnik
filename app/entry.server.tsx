// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols,DuplicatedCode

/**
 * By default, Remix will handle generating the HTTP Response for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.server
 */

import { randomBytes } from 'node:crypto'
import { PassThrough } from 'node:stream'

import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import {
  type EntryContext,
  type RouterContextProvider,
  ServerRouter,
} from 'react-router'

import { getEnv, initEnv } from '~/utils/env.server'

// Reject/cancel all pending promises after 5 seconds
export const streamTimeout = 5000

initEnv()
global.ENV = getEnv()

// Single source of the full Content-Security-Policy, parameterised by the
// per-request nonce that authorises React Router's inline hydration script.
// `style-src 'unsafe-inline'` is a pragmatic start for React inline style
// attributes; rsms.me serves the Inter font stylesheet and its woff2 files.
function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://rsms.me",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self'",
    "font-src 'self' https://rsms.me",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  // This is ignored, so we can keep it in the template for visibility.  Feel
  // free to delete this parameter in your app if you're not using it!
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _loadContext: RouterContextProvider,
) {
  // Per-request nonce authorising React Router's inline hydration script.
  const nonce = randomBytes(16).toString('base64')

  // Baseline security headers, set once so both the bot and browser paths
  // inherit them.
  responseHeaders.set('X-Content-Type-Options', 'nosniff')
  responseHeaders.set('X-Frame-Options', 'DENY')
  // frame-ancestors covers browsers that ignore X-Frame-Options. The full
  // nonce-based policy ships as report-only first (#131 step 1); a follow-up
  // PR promotes it to the enforced header.
  responseHeaders.set('Content-Security-Policy', "frame-ancestors 'none'")
  responseHeaders.set(
    'Content-Security-Policy-Report-Only',
    buildContentSecurityPolicy(nonce),
  )

  // Route loaders may set a stricter policy (magic-link verify sends
  // `no-referrer`) — only fill in the default when none is set.
  if (!responseHeaders.has('Referrer-Policy')) {
    responseHeaders.set('Referrer-Policy', 'same-origin')
  }

  // HSTS is production-only because local dev runs on plain HTTP.
  if (process.env.NODE_ENV === 'production') {
    responseHeaders.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
  }

  return isbot(request.headers.get('user-agent') || '')
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        nonce,
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        reactRouterContext,
        nonce,
      )
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  nonce: string,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        nonce={nonce}
        url={request.url}
      />,
      {
        nonce,
        onAllReady() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
        onError(error: unknown) {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
        onShellError(error: unknown) {
          reject(error)
        },
      },
    )

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000)
  })
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  nonce: string,
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter
        context={reactRouterContext}
        nonce={nonce}
        url={request.url}
      />,
      {
        nonce,
        onError(error: unknown) {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
        onShellError(error: unknown) {
          reject(error)
        },
        onShellReady() {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set('Content-Type', 'text/html')

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
      },
    )

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000)
  })
}
