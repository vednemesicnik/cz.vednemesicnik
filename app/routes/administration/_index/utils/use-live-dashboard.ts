import { useState } from 'react'
import { href, useFetcher } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'
import { useLiveChanges } from '~/hooks/use-live-changes'
import { useRevalidateAt } from '~/hooks/use-revalidate-at'
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
  const { liveChanges, onEvent } = useLiveChanges({
    authorId: loaderData.authorId,
    keyOf: (event) => {
      const type = TYPE_BY_ENTITY[event.entity]
      return type === undefined ? null : `${type}:${event.entityId}`
    },
  })

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
    onEvent,
    revalidator: rowsRevalidator,
  })

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
