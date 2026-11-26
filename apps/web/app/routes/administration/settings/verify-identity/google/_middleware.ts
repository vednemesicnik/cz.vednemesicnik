import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [
  createRateLimitMiddleware({
    key: 'identity-check-google',
    limit: 10,
    windowMs: 15 * 60 * 1000, // 10 starts per 15 minutes per IP
  }),
]
