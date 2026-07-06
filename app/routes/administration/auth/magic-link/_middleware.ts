import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import type { Route } from './+types/route'

export const middleware: Route.MiddlewareFunction[] = [
  createRateLimitMiddleware({
    key: 'magic-link',
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes per IP
  }),
]
