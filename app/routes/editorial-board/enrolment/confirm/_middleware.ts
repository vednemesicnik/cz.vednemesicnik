import type { Route } from './+types/route'

// The token is in the address. Here and not in a `headers` export, which covers neither
// the `.data` answer of the action nor the error page, and both have the same address.
const applyTokenHeaders = (headers: Headers) => {
  headers.set('Cache-Control', 'private, no-store')
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
