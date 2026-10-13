type Listener = (message: MessageEvent<string>) => void

export type SharedEventSource = {
  /** Returns the unsubscribe function. */
  subscribe: (eventName: string, listener: Listener) => () => void
}

const RECONNECT_DELAY_MILLISECONDS = 10_000

// Navigating between two subscribing pages unsubscribes the old one before the
// new one subscribes; the grace keeps the connection across that gap.
const CLOSE_GRACE_MILLISECONDS = 1000

/**
 * One refcounted `EventSource` for many subscribers: the first subscription opens
 * the connection, the last unsubscribe closes it after
 * {@link CLOSE_GRACE_MILLISECONDS} unless someone subscribes meanwhile. Without
 * `EventSource` (server rendering) subscribing does nothing.
 */
export const createSharedEventSource = (url: string): SharedEventSource => {
  const listenersByEventName = new Map<string, Set<EventListener>>()
  let source: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let closeTimer: ReturnType<typeof setTimeout> | undefined

  const hasListeners = () => listenersByEventName.size > 0

  const open = () => {
    const eventSource = new EventSource(url)

    // EventSource retries a dropped connection by itself but gives up after a
    // non-200 answer (a deploy's 502); retry that later while someone listens.
    eventSource.onerror = () => {
      if (
        eventSource.readyState === EventSource.CLOSED &&
        source === eventSource
      ) {
        source = null
        reconnectTimer = setTimeout(() => {
          reconnectTimer = undefined

          if (hasListeners() && source === null) {
            open()
          }
        }, RECONNECT_DELAY_MILLISECONDS)
      }
    }

    for (const [eventName, listeners] of listenersByEventName) {
      for (const listener of listeners) {
        eventSource.addEventListener(eventName, listener)
      }
    }

    source = eventSource
  }

  const close = () => {
    closeTimer = undefined
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
    source?.close()
    source = null
  }

  const subscribe = (eventName: string, listener: Listener) => {
    if (typeof EventSource === 'undefined') {
      return () => {}
    }

    clearTimeout(closeTimer)
    closeTimer = undefined

    const eventListener: EventListener = (event) =>
      listener(event as MessageEvent<string>)
    const listeners = listenersByEventName.get(eventName) ?? new Set()
    listeners.add(eventListener)
    listenersByEventName.set(eventName, listeners)

    if (source === null && reconnectTimer === undefined) {
      open()
    } else {
      source?.addEventListener(eventName, eventListener)
    }

    let isSubscribed = true

    return () => {
      if (!isSubscribed) {
        return
      }

      isSubscribed = false
      listeners.delete(eventListener)
      source?.removeEventListener(eventName, eventListener)

      if (listeners.size === 0) {
        listenersByEventName.delete(eventName)
      }

      if (!hasListeners()) {
        closeTimer = setTimeout(close, CLOSE_GRACE_MILLISECONDS)
      }
    }
  }

  return { subscribe }
}
