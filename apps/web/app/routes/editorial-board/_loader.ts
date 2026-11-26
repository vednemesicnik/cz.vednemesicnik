import { getEditorialBoard } from '~/utils/editorial-board.server'

export const loader = async () => {
  // `current` is the immediately-servable data (`null` when GAS is unconfigured
  // or every resilience layer is exhausted → the route renders a fallback).
  // `refreshed` is the un-awaited fresh-data promise; React Router streams it so
  // the page re-renders when it settles (or stays on stale data if it is `null`
  // or resolves to `null`). Do NOT await it.
  const { current, refreshed } = await getEditorialBoard()

  return { editorialBoard: current, refreshedEditorialBoard: refreshed }
}
