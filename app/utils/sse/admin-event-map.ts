// Types only, server-free, so the client hooks can import them.

import type { AccountEvent } from './account-event'
import type { ContentEvent } from './content-event'

/** The events on the `admin` channel, by their server-sent event name. */
export type AdminEventMap = {
  'content-change': ContentEvent
  'account-change': AccountEvent
}

export type AdminEventName = keyof AdminEventMap
