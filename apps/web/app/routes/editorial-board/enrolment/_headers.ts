import type { Route } from './+types/route'

// The form carries a token per visitor, and an action's answer the values they typed.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
})
