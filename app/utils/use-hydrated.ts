import { useSyncExternalStore } from 'react'

function subscribe() {
  return () => {}
}

/**
 * Custom hook to determine if the component is hydrated.
 *
 * This hook uses `useSyncExternalStore` to manage the hydration state.
 *
 * - When doing Client-Side Rendering, the result will always be false on the
 *   first render and true from then on. Even if a new component renders it will
 *   always start with true.
 * - When doing Server-Side Rendering, the result will always be false.
 *
 * @returns {boolean} - Returns true if the component is hydrated, otherwise false.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
}
