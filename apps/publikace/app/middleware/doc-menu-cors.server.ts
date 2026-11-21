import { cors } from 'remix/middleware/cors'
import type { Middleware } from 'remix/router'

/**
 * The article Doc's dialog calls the app from the browser: _Označit_ sends the identity token the
 * menu item took with `fetch`, from the sandbox origin Google gives a script's dialog
 * (`https://n-…-script.googleusercontent.com`). `google.script.run` would run as the browser's
 * default Google account rather than the one that clicked (`doc-menu/controller.ts`).
 *
 * Any origin, and no credentials: the bearer token is the only proof a call carries and nothing
 * rides on a cookie, so naming the sandbox origins would stop no caller that sends the same
 * request from outside a browser. Only the Doc menu's paths answer CORS; every other `OPTIONS`
 * reaches the router as it would without this.
 */

const DOC_MENU_PREFIX = '/api/v1/doc-menu/'

export function docMenuCors(): Middleware {
  let allowing = cors({
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
    methods: ['POST'],
    origin: '*',
  })
  return (context, next) =>
    context.url.pathname.startsWith(DOC_MENU_PREFIX) ? allowing(context, next) : next()
}
