import type { Route } from './+types/route'

// No token here, but the same treatment as the page it comes from: nothing to index, and
// the thank-you belongs to the person who just answered.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
})
