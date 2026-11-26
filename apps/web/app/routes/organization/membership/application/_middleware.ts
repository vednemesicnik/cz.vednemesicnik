import { VERIFICATION_TRIES_PER_IP } from '~/config/membership-application-config'
import { createRateLimitMiddleware } from '~/utils/rate-limit.server'

import { parseIntent } from './_intent'
import { parseStepName } from './_step'
import type { Route } from './+types/route'

const limitSubmissions = createRateLimitMiddleware({
  key: 'membership-application',
  limit: 3,
  windowMs: 60 * 60 * 1000, // 3 submissions per hour per IP
})

const limitCodeTries = createRateLimitMiddleware({
  key: 'membership-application-code',
  limit: VERIFICATION_TRIES_PER_IP,
  windowMs: 60 * 60 * 1000,
})

// Of the signature step's POSTs, the submit and the code tries count here, each
// against its own limit, before the body is read: the intent is in the address
// for that. Sending a code is limited in the action, and only when an e-mail
// actually goes (log 0073): saving the details with the same address sends
// nothing, and every *Opravit údaje* would otherwise take an attempt away.
export const middleware: Route.MiddlewareFunction[] = [
  (args, next) => {
    if (parseStepName(args.params.stepName) !== 'signature') return next()

    switch (parseIntent(new URL(args.request.url))) {
      case null:
        return limitSubmissions(args, next)
      case 'verify-code':
        return limitCodeTries(args, next)
      case 'send-code':
        return next()
    }
  },
]
