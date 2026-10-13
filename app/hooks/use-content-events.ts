import { useEffect, useEffectEvent } from 'react'
import { useRevalidator } from 'react-router'

import { adminEventSource } from '~/utils/sse/admin-event-source'
import type { ContentEvent } from '~/utils/sse/content-event'

const REVALIDATION_DELAY_MILLISECONDS = 300

type Options = {
  filter?: (event: ContentEvent) => boolean
}

const parseContentEvent = (data: string): ContentEvent | null => {
  try {
    return JSON.parse(data) as ContentEvent
  } catch {
    return null
  }
}

/**
 * Re-runs the page's loaders when content changes elsewhere, debounced by
 * {@link REVALIDATION_DELAY_MILLISECONDS}. While the tab is hidden the changes
 * wait and revalidate once on return. Keeps the shared administration stream open
 * while the calling page is mounted.
 *
 * @param options - `filter` narrows which content events concern the page.
 */
export const useContentEvents = (options?: Options): void => {
  const revalidator = useRevalidator()

  const isRelevant = useEffectEvent(
    (event: ContentEvent) => options?.filter?.(event) ?? true,
  )
  const isRevalidating = useEffectEvent(() => revalidator.state !== 'idle')
  const revalidate = useEffectEvent(() => revalidator.revalidate())

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

    const unsubscribe = adminEventSource.subscribe(
      'content-change',
      (message) => {
        const event = parseContentEvent(message.data)

        if (event !== null && isRelevant(event)) {
          scheduleRevalidation()
        }
      },
    )

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
  }, [])
}
