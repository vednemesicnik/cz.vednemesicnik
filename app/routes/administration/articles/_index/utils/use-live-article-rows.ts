import { useEffect, useState } from 'react'
import { useFetcher, useLocation } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'

import type { loader } from '../_loader'
import type { Route } from '../+types/route'
import { PINNED_ROWS_PARAM } from '../pinned-rows'
import { orderPinnedRows } from './order-pinned-rows'
import { startPendingTints } from './start-pending-tints'

type LoaderData = Route.ComponentProps['loaderData']

/** A row someone else changed while the list is open (22f). */
export type LiveChange = {
  name: string
  occurredAt: Date
  /** Counts the changes, so a second one restarts the tint. */
  sequence: number
  /** Client time the tint started, `null` while it waits for a hidden tab. */
  tintStartedAt: number | null
}

/**
 * Keeps the article list live without moving its rows (design 22f). A change
 * made elsewhere reloads exactly the rows on screen, in their order, along with
 * the waiting work and the Stav counts; a new order, dropped rows and new rows
 * wait for the next load (navigation, a filter, a reload or one's own action).
 *
 * @param loaderData - The list as last loaded.
 * @returns The rows to show, the live counts and the rows changed by someone
 *   else since the list was opened.
 */
export const useLiveArticleRows = (loaderData: LoaderData) => {
  const location = useLocation()

  // Each load of the list starts a new generation, so a live load never mixes
  // with a list it wasn't made for.
  const [generation, setGeneration] = useState({ base: loaderData, count: 0 })
  if (generation.base !== loaderData) {
    setGeneration({ base: loaderData, count: generation.count + 1 })
  }

  const fetcher = useFetcher<typeof loader>({
    key: `article-list-live-${generation.count}`,
  })
  const [liveChanges, setLiveChanges] = useState<
    ReadonlyMap<string, LiveChange>
  >(new Map())

  const pinnedIds = loaderData.articles.map((article) => article.id)

  useContentEvents({
    filter: (event) => event.entity === 'article',
    onEvent: (event) => {
      // One's own change isn't announced, and the line no longer names the
      // latest change: the row returns to its 22b fact.
      if (event.actor.authorId === loaderData.authorId) {
        setLiveChanges((current) => {
          if (!current.has(event.entityId)) {
            return current
          }
          const next = new Map(current)
          next.delete(event.entityId)
          return next
        })
        return
      }

      setLiveChanges((current) =>
        new Map(current).set(event.entityId, {
          name: event.actor.name,
          occurredAt: new Date(event.occurredAt),
          sequence: (current.get(event.entityId)?.sequence ?? 0) + 1,
          // The tint is meant to be seen, so a hidden tab holds it back.
          tintStartedAt:
            document.visibilityState === 'visible' ? Date.now() : null,
        }),
      )
    },
    revalidator: {
      revalidate: () => {
        const search = new URLSearchParams(location.search)
        search.set(PINNED_ROWS_PARAM, pinnedIds.join(','))
        // The index route, not the articles layout above it.
        search.set('index', '')

        return fetcher.load(`${location.pathname}?${search}`)
      },
      state: fetcher.state,
    },
  })

  // Back in the tab, the held-back tints start, as the deferred reload does.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setLiveChanges((current) => startPendingTints(current, Date.now()))
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const live = fetcher.data

  return {
    articles:
      live === undefined
        ? loaderData.articles
        : orderPinnedRows(pinnedIds, live.articles),
    liveChanges,
    pendingCount: (live ?? loaderData).pendingCount,
    queueCounts: (live ?? loaderData).queueCounts,
  }
}
