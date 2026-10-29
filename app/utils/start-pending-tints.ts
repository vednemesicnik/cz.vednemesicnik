import type { LiveChange } from '~/hooks/use-live-changes'

/**
 * Starts the tints that waited for a hidden tab (22f): a change heard while the
 * list wasn't seen tints once the tab is visible again.
 *
 * @param changes - The live changes, keyed by row.
 * @param now - The tab's time (`performance.now()`) it became visible.
 * @returns The changes with every pending tint started at `now`, or the same map
 *   when none waited, so nothing re-renders.
 */
export const startPendingTints = (
  changes: ReadonlyMap<string, LiveChange>,
  now: number,
): ReadonlyMap<string, LiveChange> => {
  const hasPending = [...changes.values()].some(
    (change) => change.tintStartedAt === null,
  )

  if (!hasPending) return changes

  return new Map(
    [...changes].map(([id, change]) => [
      id,
      change.tintStartedAt === null
        ? { ...change, tintStartedAt: now }
        : change,
    ]),
  )
}
