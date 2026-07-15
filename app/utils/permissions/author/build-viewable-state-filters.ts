import type { ContentState } from '@generated/prisma/enums'

type StateRights = {
  state: ContentState
  rights: { hasOwn: boolean; hasAny: boolean }
}

/**
 * Builds the Prisma `where.OR` branches for a state-partitioned content list,
 * honoring per-state view rights so a list never leaks rows the role cannot view:
 *
 * - no view right (`!hasOwn && !hasAny`) → the state is **omitted**, so none of its
 *   rows are returned (previously an unfiltered branch leaked every row of that state)
 * - `own` only → the state is scoped to the viewer via `ownFilter`
 * - `any` → the state is unscoped
 *
 * `ownFilter` is the entity-specific "mine" predicate, e.g. `{ authorId }` for
 * single-author content or `{ authors: { some: { id } } }` for articles.
 *
 * An empty result (`OR: []`) is a valid "match nothing" — the correct outcome when a
 * role has no view right for any listed state.
 */
export const buildViewableStateFilters = <
  OwnFilter extends Record<string, unknown>,
>(
  stateRights: StateRights[],
  ownFilter: OwnFilter,
): ({ state: ContentState } | ({ state: ContentState } & OwnFilter))[] =>
  stateRights
    .filter(({ rights }) => rights.hasOwn || rights.hasAny)
    .map(({ state, rights }) =>
      rights.hasOwn && !rights.hasAny ? { state, ...ownFilter } : { state },
    )
