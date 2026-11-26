import { logger, type LoggerOptions } from 'remix/middleware/logger'

import { routes } from '../routes.ts'
import { isPublicLinkPath, withoutLinkKey } from './public-link.server.ts'

/**
 * The paths whose query is left out of the log: Google's two callbacks, whose `code` and `state`
 * are the sign-in or the connection in progress. The whole query goes, because nothing in it is
 * worth a line: a refusal is told by the controller's own `[auth]` or `[drive]` line.
 */
const QUERY_LEFT_OUT = new Set([
  routes.auth.google.callback.href(),
  routes.settings.account.callback.href(),
])

/**
 * Remix's `logger()`, with a shared link's key and a Google callback's query left out of the line.
 * Logs are read and exported for other reasons, and on Fly.io they leave the machine; the key is
 * usable by whoever holds it, and an authorisation code has no business there either.
 *
 * The logger offers no hook for the path, only the finished line, so such a request gets a `log`
 * that replaces that request's own string — `%path` is the pathname followed by the query —
 * rather than a pattern that would guess where a key or a code is. The same `log` is
 * `context.logger`, so whatever a controller logs under `/l/` loses the key too.
 */
export function logRequests(options: LoggerOptions = {}): ReturnType<typeof logger> {
  let log = options.log ?? console.log
  let everyRequest = logger(options)
  return (context, next) => {
    let redact = redactionFor(context.url)
    if (redact === null) return everyRequest(context, next)
    let redactedRequest = logger({ ...options, log: (message) => log(redact(message)) })
    return redactedRequest(context, next)
  }
}

/** What a line about this request must lose, or `null` when it is logged as it is. */
function redactionFor({ pathname, search }: URL): ((message: string) => string) | null {
  if (isPublicLinkPath(pathname)) {
    let redacted = withoutLinkKey(pathname)
    return (message) => message.replaceAll(pathname, redacted)
  }
  if (QUERY_LEFT_OUT.has(pathname) && search !== '') {
    return (message) => message.replaceAll(pathname + search, pathname)
  }
  return null
}
