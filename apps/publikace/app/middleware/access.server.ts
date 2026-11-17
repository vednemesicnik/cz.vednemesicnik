import { createContextKey, type Middleware } from 'remix/router'

import type { AccessContext } from '../auth/access.server.ts'

/**
 * The access list, the membership service and the domain, for the controllers and the auth
 * scheme. Read with `context.get(Access)`.
 *
 * Handed in rather than built here, so a test runs on its own database and a fake service.
 */
export const Access = createContextKey<AccessContext>()

export function loadAccess(
  access: AccessContext,
): Middleware<{ key: typeof Access; property: 'access'; value: AccessContext }> {
  return (context, next) => {
    context.set(Access, access)
    return next()
  }
}
