import { useEffect, useEffectEvent } from 'react'
import { useRevalidator } from 'react-router'
import type { AdminEventMap, AdminEventName } from '~/utils/sse/admin-event-map'
import { adminEventSource } from '~/utils/sse/admin-event-source'

const REVALIDATION_DELAY_MILLISECONDS = 300

/** What reloads the page's data; `useRevalidator()` and a fetcher both fit. */
type Revalidator = {
  revalidate: () => unknown
  state: string
}

export type AdminEventsOptions<Event> = {
  filter?: (event: Event) => boolean
  onEvent?: (event: Event) => void
  revalidator?: Revalidator
}

const parseEvent = <Event>(data: string): Event | null => {
  try {
    return JSON.parse(data) as Event
  } catch {
    return null
  }
}

/**
 * Re-runs the page's loaders when one kind of event arrives on the
 * administration stream, debounced by {@link REVALIDATION_DELAY_MILLISECONDS}.
 * While the tab is hidden the changes wait and revalidate once on return. Keeps
 * the shared administration stream open while the calling page is mounted.
 *
 * @param eventName - Which events to hear: content or account changes.
 * @param options - `filter` narrows which events concern the page; `onEvent`
 *   hears each of them at once, before the debounced revalidation;
 *   `revalidator` replaces the page's revalidation (the article list loads only
 *   the rows on screen, 22f).
 */
export const useAdminEvents = <Name extends AdminEventName>(
  eventName: Name,
  options?: AdminEventsOptions<AdminEventMap[Name]>,
): void => {
  const pageRevalidator = useRevalidator()
  const revalidator = options?.revalidator ?? pageRevalidator

  const isRelevant = useEffectEvent(
    (event: AdminEventMap[Name]) => options?.filter?.(event) ?? true,
  )
  const isRevalidating = useEffectEvent(() => revalidator.state !== 'idle')
  const revalidate = useEffectEvent(() => revalidator.revalidate())
  const handleEvent = useEffectEvent((event: AdminEventMap[Name]) =>
    options?.onEvent?.(event),
  )

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let hasHiddenChange = false

    const scheduleRevalidation = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined

        if (document.visibilityState === 'hidden') {
          hasHiddenChange = true
          return
        }

        // A running revalidation may predate the change; try again after it.
        if (isRevalidating()) {
          scheduleRevalidation()
          return
        }

        hasHiddenChange = false
        void revalidate()
      }, REVALIDATION_DELAY_MILLISECONDS)
    }

    const unsubscribe = adminEventSource.subscribe(eventName, (message) => {
      const event = parseEvent<AdminEventMap[Name]>(message.data)

      if (event !== null && isRelevant(event)) {
        handleEvent(event)
        scheduleRevalidation()
      }
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasHiddenChange) {
        scheduleRevalidation()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      unsubscribe()
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [eventName])
}
