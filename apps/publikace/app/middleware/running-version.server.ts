import { createContextKey, type Middleware } from 'remix/router'

import type { RunningVersion } from '../auth/environment.server.ts'

/**
 * Which build of the app runs, for the last line of the panel's foot (`31a`). Read with
 * `context.get(RunningVersionKey)`, as `ReviewCount`, so no page has to pass it down.
 */
export const RunningVersionKey = createContextKey<RunningVersion | null>(null)

/**
 * Hands every request the version the app was started with; it is fixed for the deployment.
 *
 * @param version `runningVersion()` of the app's environment.
 */
export function provideRunningVersion(version: RunningVersion | null): Middleware<{
  key: typeof RunningVersionKey
  property: 'runningVersion'
  value: RunningVersion | null
}> {
  return (context, next) => {
    context.set(RunningVersionKey, version)
    return next()
  }
}
