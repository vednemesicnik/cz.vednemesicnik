import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import { parseStepName } from './_step'
import type { Route } from './+types/route'

const limitSubmissions = createRateLimitMiddleware({
  key: 'membership-application',
  limit: 3,
  windowMs: 60 * 60 * 1000, // 3 submissions per hour per IP
})

// Only sending counts: saving the details posts nothing anywhere, and every
// *Opravit údaje* would otherwise take an attempt away. It runs before the body
// is read, so it also guards the memory an upload takes.
export const middleware: Route.MiddlewareFunction[] = [
  (args, next) =>
    parseStepName(args.params.stepName) === 'signature'
      ? limitSubmissions(args, next)
      : next(),
]
