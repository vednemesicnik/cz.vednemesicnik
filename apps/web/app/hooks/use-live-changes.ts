import { useEffect, useState } from 'react'
import type { ContentEvent } from '~/utils/sse/content-event'
import { startPendingTints } from '~/utils/start-pending-tints'

/** A row someone else changed while the page is open (22f). */
export type LiveChange = {
  name: string
  occurredAt: Date
  /** Counts the changes, so a second one restarts the tint. */
  sequence: number
  /** The tab's time (`performance.now()`) the tint started, `null` while it waits for a hidden tab. */
  tintStartedAt: number | null
  /** An edit hold came after it: the line is the row's fact again, the tint runs on (22f). */
  isLineSuperseded?: boolean
}

type Options = {
  /** The signed-in author, whose own changes aren't announced. */
  authorId: string
  /** The row an event concerns, or `null` when it changes no row. */
  keyOf: (event: ContentEvent) => string | null
}

/**
 * The rows someone else changed while the page is open (design 22f), for a
 * list and the dashboard alike: each change tints its row and names who made
 * it. Taking or releasing the edit hold changes nothing to announce, and one's
 * own change takes the announcement back. A hidden tab holds the tint back
 * until it is seen.
 *
 * @param options.authorId - The signed-in author.
 * @param options.keyOf - The row key of an event, or `null` for none.
 * @returns The live changes by row key, and `onEvent` for `useContentEvents`.
 */
export const useLiveChanges = ({ authorId, keyOf }: Options) => {
  const [liveChanges, setLiveChanges] = useState<
    ReadonlyMap<string, LiveChange>
  >(new Map())

  const onEvent = (event: ContentEvent) => {
    const key = keyOf(event)
    if (key === null) {
      return
    }

    // Taking or releasing the edit hold is no change to react to (no tint),
    // but a running tint finishes; the line goes back to the row's fact,
    // which is newer than the change the hold covered (22f, 2txmjnaq).
    if (event.change === 'hold') {
      setLiveChanges((current) => {
        const liveChange = current.get(key)
        if (liveChange === undefined) {
          return current
        }
        return new Map(current).set(key, {
          ...liveChange,
          isLineSuperseded: true,
        })
      })
      return
    }

    // One's own change isn't announced, and the line no longer names the
    // latest change: the row returns to its 22b fact.
    if (event.actor.authorId === authorId) {
      setLiveChanges((current) => {
        if (!current.has(key)) {
          return current
        }
        const next = new Map(current)
        next.delete(key)
        return next
      })
      return
    }

    setLiveChanges((current) =>
      new Map(current).set(key, {
        name: event.actor.name,
        occurredAt: new Date(event.occurredAt),
        sequence: (current.get(key)?.sequence ?? 0) + 1,
        // The tint is meant to be seen, so a hidden tab holds it back.
        tintStartedAt:
          document.visibilityState === 'visible' ? performance.now() : null,
      }),
    )
  }

  // Back in the tab, the held-back tints start, as the deferred reload does.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setLiveChanges((current) =>
          startPendingTints(current, performance.now()),
        )
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return { liveChanges, onEvent }
}
