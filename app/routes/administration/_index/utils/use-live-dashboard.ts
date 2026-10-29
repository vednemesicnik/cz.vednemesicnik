import { useEffect, useState } from 'react'
import { href, useFetcher } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'
import { useRevalidateAt } from '~/hooks/use-revalidate-at'
import { startPendingTints } from '~/routes/administration/articles/_index/utils/start-pending-tints'
import type { LiveChange } from '~/routes/administration/articles/_index/utils/use-live-article-rows'
import type { ContentEventEntity } from '~/utils/sse/content-event'

import type { loader } from '../_loader'
import type { Route } from '../+types/route'
import type { DashboardType } from '../dashboard-types'
import { PINNED_DASHBOARD_ROWS_PARAM } from '../pinned-dashboard-rows'
import { composeLiveSection } from './compose-live-section'

type LoaderData = Route.ComponentProps['loaderData']

// The dashboard's types by the content event's entity; an episode's link is
// part of its episode, which sends its own event.
const TYPE_BY_ENTITY: Partial<Record<ContentEventEntity, DashboardType>> = {
  article: 'article',
  article_category: 'category',
  article_tag: 'tag',
  issue: 'issue',
  podcast: 'podcast',
  podcast_episode: 'episode',
}

/**
 * Keeps the dashboard live without moving its rows (design 22f, gl703egt). A
 * change made elsewhere reloads exactly the rows on screen, along with each
 * section: a row stays where it was with its new state and actions, even one
 * that left its section, and the queue takes a newly submitted row at its
 * end. The rest waits for the next load (navigation, a reload or one's own
 * action).
 *
 * @param loaderData - The dashboard as last loaded.
 * @returns The sections to show and the rows changed by someone else since
 *   the dashboard was opened, by row key.
 */
export const useLiveDashboard = (loaderData: LoaderData) => {
  // Each load of the dashboard starts a new generation, so a live load never
  // mixes with a dashboard it wasn't made for.
  const [generation, setGeneration] = useState({ base: loaderData, count: 0 })
  if (generation.base !== loaderData) {
    setGeneration({ base: loaderData, count: generation.count + 1 })
  }

  const fetcher = useFetcher<typeof loader>({
    key: `dashboard-live-${generation.count}`,
  })
  const [liveChanges, setLiveChanges] = useState<
    ReadonlyMap<string, LiveChange>
  >(new Map())

  // What is on screen: each live load is laid over the rows shown before it,
  // so a row that joined the queue live stays put when it leaves again.
  const live = fetcher.data
  const [shown, setShown] = useState({
    base: loaderData,
    live,
    sections: loaderData,
  })
  if (shown.base !== loaderData) {
    setShown({ base: loaderData, live: undefined, sections: loaderData })
  } else if (live !== undefined && live !== shown.live) {
    setShown({
      base: loaderData,
      live,
      sections: {
        ...live,
        drafts: composeLiveSection({
          appendsNew: false,
          fresh: live.drafts,
          pinned: live.pinnedItems,
          shown: shown.sections.drafts,
        }),
        queue: composeLiveSection({
          appendsNew: true,
          fresh: live.queue,
          pinned: live.pinnedItems,
          shown: shown.sections.queue,
        }),
        submitted: composeLiveSection({
          appendsNew: false,
          fresh: live.submitted,
          pinned: live.pinnedItems,
          shown: shown.sections.submitted,
        }),
      },
    })
  }
  const sections = shown.sections

  const pinnedKeys = [
    ...sections.queue,
    ...sections.drafts,
    ...sections.submitted,
  ].map((item) => item.key)

  // Reloads the sections and exactly the rows on screen.
  const rowsRevalidator = {
    revalidate: () => {
      const search = new URLSearchParams({
        index: '',
        [PINNED_DASHBOARD_ROWS_PARAM]: pinnedKeys.join(','),
      })

      return fetcher.load(`${href('/administration')}?${search}`)
    },
    state: fetcher.state,
  }

  useContentEvents({
    filter: (event) => TYPE_BY_ENTITY[event.entity] !== undefined,
    onEvent: (event) => {
      const key = `${TYPE_BY_ENTITY[event.entity]}:${event.entityId}`

      // Taking or releasing the edit hold is no change to react to (no tint),
      // but a running tint finishes; the line goes back to the row's fact
      // (22f, 2txmjnaq).
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
      // latest change.
      if (event.actor.authorId === loaderData.authorId) {
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
    },
    revalidator: rowsRevalidator,
  })

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

  // An edit hold's expiry sends no event; the rows look again then (22f).
  useRevalidateAt(
    [...sections.queue, ...sections.drafts, ...sections.submitted].map(
      (item) =>
        item.type === 'article' || item.type === 'issue'
          ? item.row.heldUntil
          : null,
    ),
    rowsRevalidator,
  )

  return {
    ...sections,
    liveChanges,
    // What waits now, even while a row taken back still stands (gl703egt).
    pendingCount: (live ?? loaderData).queue.length,
  }
}
