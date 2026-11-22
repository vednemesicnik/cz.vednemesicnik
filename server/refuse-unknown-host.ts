import type { Middleware } from '@remix-run/fetch-router'

import { isWebHost } from './is-web-host.ts'

/**
 * Answers 404 to a host no application on this machine serves, before any file or app sees
 * the request.
 *
 * `/health` passes on every host: Fly's check calls the machine over its private network,
 * and its documentation doesn't say which `Host` that carries.
 */
export const refuseUnknownHost: Middleware = (context, next) => {
  if (context.url.pathname === '/health' || isWebHost(context.url.hostname)) {
    return next()
  }

  return Promise.resolve(
    new Response('Not Found', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 404,
    }),
  )
}
