import { DONATION_VERIFICATION_TRIES_PER_IP } from '~/config/donation-request-config'
import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import { parseIntent } from './_intent'
import type { Route } from './+types/route'

const limitCodeTries = createRateLimitMiddleware({
  key: 'donation-request-code',
  limit: DONATION_VERIFICATION_TRIES_PER_IP,
  windowMs: 60 * 60 * 1000,
})

// A code try and a new submit after a failed one count against the tries, before
// the body is read. Sending a code is limited in the action, and only when an
// e-mail actually goes (log 0073).
export const middleware: Route.MiddlewareFunction[] = [
  (args, next) => {
    if (args.request.method !== 'POST') return next()

    switch (parseIntent(new URL(args.request.url))) {
      case 'verify-code':
      case 'submit':
        return limitCodeTries(args, next)
      default:
        return next()
    }
  },
]
