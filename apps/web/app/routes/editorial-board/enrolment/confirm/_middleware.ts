import type { Route } from './+types/route'

// The token is in the address. Here and not in a `headers` export forwarding the loader's,
// which sees nothing on the action's `.data` answer, and none reaches an error page rendered
// at a boundary above. `no-transform` keeps Cloudflare from hiding the address the page
// shows from anyone without JavaScript.
const applyTokenHeaders = (headers: Headers) => {
  headers.set('Cache-Control', 'private, no-store, no-transform')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Robots-Tag', 'noindex, nofollow')
}

export const middleware: Route.MiddlewareFunction[] = [
  async (_arguments, next) => {
    try {
      const response = await next()
      if (response instanceof Response) applyTokenHeaders(response.headers)
      return response
    } catch (thrown) {
      if (thrown instanceof Response) applyTokenHeaders(thrown.headers)
      throw thrown
    }
  },
]
