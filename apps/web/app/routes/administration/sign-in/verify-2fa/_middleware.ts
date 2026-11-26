import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [
  createRateLimitMiddleware({
    key: 'verify-2fa',
    limit: 10,
    windowMs: 15 * 60 * 1000, // 10 attempts per 15 minutes per IP
  }),
]
