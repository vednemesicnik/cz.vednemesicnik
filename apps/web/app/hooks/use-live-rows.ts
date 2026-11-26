import { useState } from 'react'
import { useFetcher, useLocation } from 'react-router'

import { orderPinnedRows } from '~/utils/pinned-rows/order-pinned-rows'
import { PINNED_ROWS_PARAM } from '~/utils/pinned-rows/pinned-rows-param'
import type { ContentEvent } from '~/utils/sse/content-event'

import { useContentEvents } from './use-content-events'
import { useLiveChanges } from './use-live-changes'
import { useRevalidateAt } from './use-revalidate-at'

type Options<Data, Row extends { id: string }> = {
  loaderData: Data
  authorId: string
  rowsOf: (data: Data) => Row[]
  fetcherKey: string
  filter: (event: ContentEvent) => boolean
  keyOf: (event: ContentEvent) => string | null
  heldUntilOf?: (data: Data) => (string | null)[]
}

/**
 * Keeps a content list live without moving its rows (design 22f, xkg6rdz4).
 * A change made elsewhere reloads exactly the rows on screen, in their order,
 * along with the rest of the index route's data (counts, a page's header); a
 * new order, dropped rows and new rows wait for the next load (navigation, a
 * filter, a reload or one's own action). The route's loader answers the
 * pinned ids (`parsePinnedRowIds`) with those rows only and no redirect.
 *
 * @param options.loaderData - The index route's data as last loaded.
 * @param options.authorId - The signed-in author, whose own changes aren't
 *   announced.
 * @param options.rowsOf - The list's rows in the data.
 * @param options.fetcherKey - Names the live load, unique on the page.
 * @param options.filter - The events that concern the page; an event the
 *   rows don't key still reloads them, untinted (counts, related names).
 * @param options.keyOf - The row an event tints, or `null` for none.
 * @param options.heldUntilOf - When the edit holds shown should expire: an
 *   expiry sends no event, so the rows look again then.
 * @returns `live`, the latest data for what the rows stand beside (counts, a
 *   page's header) — not totals or paging, which a live load counts over the
 *   pinned rows only and stay with `loaderData`; `rows`, in the order on
 *   screen; and the rows changed by someone else since the list was opened.
 */
export const useLiveRows = <Data, Row extends { id: string }>({
  loaderData,
  authorId,
  rowsOf,
  fetcherKey,
  filter,
  keyOf,
  heldUntilOf,
}: Options<Data, Row>) => {
  const location = useLocation()

  // Each load of the list starts a new generation, so a live load never mixes
  // with a list it wasn't made for.
  const [generation, setGeneration] = useState({ base: loaderData, count: 0 })
  if (generation.base !== loaderData) {
    setGeneration({ base: loaderData, count: generation.count + 1 })
  }

  const fetcher = useFetcher<Data>({
    key: `${fetcherKey}-${generation.count}`,
  })
  const { liveChanges, onEvent } = useLiveChanges({ authorId, keyOf })

  const pinnedIds = rowsOf(loaderData).map((row) => row.id)

  // Reloads exactly the rows on screen.
  const rowsRevalidator = {
    revalidate: () => {
      const search = new URLSearchParams(location.search)
      search.set(PINNED_ROWS_PARAM, pinnedIds.join(','))
      // The index route, not the layout above it.
      search.set('index', '')

      return fetcher.load(`${location.pathname}?${search}`)
    },
    state: fetcher.state,
  }

  useContentEvents({ filter, onEvent, revalidator: rowsRevalidator })

  // A loader's data is its own serialized form.
  const fetched = fetcher.data as Data | undefined
  const live = fetched ?? loaderData
  const rows =
    fetched === undefined
      ? rowsOf(loaderData)
      : orderPinnedRows(pinnedIds, rowsOf(fetched))

  // An edit hold's expiry sends no event; the rows look again then (22f).
  useRevalidateAt(heldUntilOf?.(live) ?? [], rowsRevalidator)

  return { live, liveChanges, rows }
}
