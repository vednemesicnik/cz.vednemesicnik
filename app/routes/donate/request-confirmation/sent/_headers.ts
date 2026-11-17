import type { Route } from './+types/route'

// The page shows the request's code from the cookie.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
})
