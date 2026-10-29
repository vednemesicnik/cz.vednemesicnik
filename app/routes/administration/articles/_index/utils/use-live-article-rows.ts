import { useState } from 'react'
import { useFetcher, useLocation } from 'react-router'

import { useContentEvents } from '~/hooks/use-content-events'
import { useLiveChanges } from '~/hooks/use-live-changes'
import { useRevalidateAt } from '~/hooks/use-revalidate-at'

import type { loader } from '../_loader'
import type { Route } from '../+types/route'
import { PINNED_ROWS_PARAM } from '../pinned-rows'
import { orderPinnedRows } from './order-pinned-rows'

type LoaderData = Route.ComponentProps['loaderData']

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
  const { liveChanges, onEvent } = useLiveChanges({
    authorId: loaderData.authorId,
    // Only the article's own change tints its row.
    keyOf: (event) => (event.entity === 'article' ? event.entityId : null),
  })

  const pinnedIds = loaderData.articles.map((article) => article.id)

  // Reloads exactly the rows on screen.
  const rowsRevalidator = {
    revalidate: () => {
      const search = new URLSearchParams(location.search)
      search.set(PINNED_ROWS_PARAM, pinnedIds.join(','))
      // The index route, not the articles layout above it.
      search.set('index', '')

      return fetcher.load(`${location.pathname}?${search}`)
    },
    state: fetcher.state,
  }

  useContentEvents({
    // A renamed or removed category or tag reloads the rows that name it,
    // without a tint: the article itself did not change (0035, 31a).
    filter: (event) =>
      event.entity === 'article' ||
      event.entity === 'article_category' ||
      event.entity === 'article_tag',
    onEvent,
    revalidator: rowsRevalidator,
  })

  const live = fetcher.data
  const articles =
    live === undefined
      ? loaderData.articles
      : orderPinnedRows(pinnedIds, live.articles)

  // An edit hold's expiry sends no event; the rows look again then (22f).
  useRevalidateAt(
    articles.map((article) => article.heldUntil),
    rowsRevalidator,
  )

  return {
    articles,
    liveChanges,
    pendingCount: (live ?? loaderData).pendingCount,
    queueCounts: (live ?? loaderData).queueCounts,
  }
}
