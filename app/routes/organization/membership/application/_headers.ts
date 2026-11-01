import type { Route } from './+types/route'

// The steps carry the applicant's details from the cookie.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
})
