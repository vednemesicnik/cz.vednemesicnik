import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

// Filled in at a meeting, by a whole room behind one address. Whoever is refused here
// does not come back after they leave (log 0065).
export const middleware: Route.MiddlewareFunction[] = [
  createRateLimitMiddleware({
    key: 'editorial-board-enrolment',
    limit: 20,
    windowMs: 60 * 60 * 1000, // 20 submissions per hour per IP
  }),
]
