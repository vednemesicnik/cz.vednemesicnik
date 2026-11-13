import type { Route } from './+types/route'

// The form is filled again from the cookie with the donor's details.
export const headers: Route.HeadersFunction = () => ({
  'Cache-Control': 'private, no-store',
})
