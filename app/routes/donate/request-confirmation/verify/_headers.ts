import type { Route } from './+types/route'

// The step shows the donor's address from the cookie.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
})
