import { createContextKey, type Middleware } from 'remix/router'
import { Session } from 'remix/session'

const TOAST_SESSION_KEY = 'toast'

/**
 * The one-line report of something the page you land on does not show by itself, like
 * _eva@vednemesicnik.cz má přístup._ after adding (`14b`). Read with `context.get(Toasts)`.
 */
export const Toasts = createContextKey<readonly string[]>([])

/** Leaves a message for the page the browser is about to be sent to. */
export function flashToast(
  context: { get(key: typeof Session): Session | undefined },
  message: string,
): void {
  context.get(Session)?.flash(TOAST_SESSION_KEY, message)
}

/**
 * Picks up the message the previous request left, before the page is drawn.
 *
 * Here and not in the component that draws it: the page renders as a stream, and a message
 * cleared while drawing could be cleared after the session was already written back, to be
 * shown again on every page. The `unset` also makes sure the session is saved without it.
 */
export function takeToasts(): Middleware<{
  key: typeof Toasts
  property: 'toasts'
  value: readonly string[]
}> {
  return (context, next) => {
    let session = context.get(Session)
    let message = session?.get(TOAST_SESSION_KEY)
    if (message !== undefined) session?.unset(TOAST_SESSION_KEY)

    context.set(Toasts, typeof message === 'string' && message !== '' ? [message] : [])
    return next()
  }
}
