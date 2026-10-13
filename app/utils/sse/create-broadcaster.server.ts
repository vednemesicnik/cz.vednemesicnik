export type ServerSentEvent = { event: string; data: string; id?: string }

type Subscriber = (event: ServerSentEvent) => void

type RetainedEvent = { event: ServerSentEvent; retainedAt: number }

export type Broadcaster = {
  /** Returns the unsubscribe function. */
  subscribe: (topic: string, subscriber: Subscriber) => () => void
  publish: (
    topic: string,
    event: ServerSentEvent,
    options?: { retain?: boolean },
  ) => void
  subscriberCount: (topic: string) => number
}

const DEFAULT_RETAINED_EVENT_TTL_MILLISECONDS = 5 * 60 * 1000

/**
 * Creates an in-memory, per-topic publish/subscribe hub for server-sent events.
 *
 * A `retain`ed event is replayed to subscribers that join later, until it is older
 * than `retainedEventTtlMilliseconds`; expired events are swept on publish and
 * subscribe, so no timer runs. A topic with no subscribers and nothing retained is
 * dropped from the map.
 */
export const createBroadcaster = (options?: {
  retainedEventTtlMilliseconds?: number
}): Broadcaster => {
  const retainedEventTtlMilliseconds =
    options?.retainedEventTtlMilliseconds ??
    DEFAULT_RETAINED_EVENT_TTL_MILLISECONDS

  const subscribersByTopic = new Map<string, Set<Subscriber>>()
  const retainedEventByTopic = new Map<string, RetainedEvent>()

  const sweepExpiredRetainedEvents = () => {
    const now = Date.now()

    for (const [topic, retained] of retainedEventByTopic) {
      if (now - retained.retainedAt >= retainedEventTtlMilliseconds) {
        retainedEventByTopic.delete(topic)
      }
    }
  }

  const deliver = (subscriber: Subscriber, event: ServerSentEvent) => {
    try {
      subscriber(event)
    } catch (error) {
      // One dead subscriber must not break the fan-out to the others.
      console.error('Server-sent event subscriber failed', error)
    }
  }

  const subscribe = (topic: string, subscriber: Subscriber) => {
    sweepExpiredRetainedEvents()

    const subscribers = subscribersByTopic.get(topic) ?? new Set<Subscriber>()
    subscribers.add(subscriber)
    subscribersByTopic.set(topic, subscribers)

    const retained = retainedEventByTopic.get(topic)

    if (retained !== undefined) {
      deliver(subscriber, retained.event)
    }

    return () => {
      subscribers.delete(subscriber)

      if (
        subscribers.size === 0 &&
        subscribersByTopic.get(topic) === subscribers
      ) {
        subscribersByTopic.delete(topic)
      }
    }
  }

  const publish = (
    topic: string,
    event: ServerSentEvent,
    publishOptions?: { retain?: boolean },
  ) => {
    sweepExpiredRetainedEvents()

    if (publishOptions?.retain === true) {
      retainedEventByTopic.set(topic, { event, retainedAt: Date.now() })
    }

    const subscribers = subscribersByTopic.get(topic)

    if (subscribers === undefined) {
      return
    }

    // Iterate a copy: a subscriber may unsubscribe while being delivered to.
    for (const subscriber of [...subscribers]) {
      deliver(subscriber, event)
    }
  }

  const subscriberCount = (topic: string) =>
    subscribersByTopic.get(topic)?.size ?? 0

  return { publish, subscribe, subscriberCount }
}
