import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [
  createRateLimitMiddleware({
    key: 'identity-check-link',
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 links per 15 minutes per IP, as sign-in
  }),
]
