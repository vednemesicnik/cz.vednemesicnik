import { createContextKey, type Middleware } from 'remix/router'
import { Session } from 'remix/session'

import type { ToastAction, ToastMessage, ToastTone } from '../ui/toast/component.tsx'

const TOAST_SESSION_KEY = 'toast'

/**
 * The one-line report of something the page you land on does not show by itself, like
 * _eva@vednemesicnik.test má přístup._ after adding (`14b`). Read with `context.get(Toasts)`.
 */
export const Toasts = createContextKey<readonly ToastMessage[]>([])

/** Leaves a message for the page the browser is about to be sent to. */
export function flashToast(
  context: { get(key: typeof Session): Session | undefined },
  message: string,
  tone: ToastTone = 'neutral',
  action?: ToastAction,
  detail?: string,
): void {
  let toast: ToastMessage = { message, tone }
  if (action !== undefined) toast.action = action
  if (detail !== undefined) toast.detail = detail
  context.get(Session)?.flash(TOAST_SESSION_KEY, toast)
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
  value: readonly ToastMessage[]
}> {
  return (context, next) => {
    let session = context.get(Session)
    let message = session?.get(TOAST_SESSION_KEY)
    if (message !== undefined) session?.unset(TOAST_SESSION_KEY)

    let toast = readToast(message)
    context.set(Toasts, toast === null ? [] : [toast])
    return next()
  }
}

function readToast(value: unknown): ToastMessage | null {
  if (typeof value !== 'object' || value === null) return null
  let { action, detail, message, tone } = value as {
    action?: unknown
    detail?: unknown
    message?: unknown
    tone?: unknown
  }
  if (typeof message !== 'string' || message === '') return null
  let toast: ToastMessage = { message, tone: tone === 'error' ? 'error' : 'neutral' }
  if (typeof detail === 'string' && detail !== '') toast.detail = detail
  let read = readAction(action)
  return read === null ? toast : { ...toast, action: read }
}

/*
 * Only a path of this app: the action is a form the page draws, with the CSRF token in it. A
 * second slash or a backslash after the first would make the browser read another host.
 */
function readAction(value: unknown): ToastAction | null {
  if (typeof value !== 'object' || value === null) return null
  let { action, label } = value as { action?: unknown; label?: unknown }
  if (typeof action !== 'string' || !/^\/(?![/\\])/.test(action)) return null
  return typeof label === 'string' && label !== '' ? { action, label } : null
}
