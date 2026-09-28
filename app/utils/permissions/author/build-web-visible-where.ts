import type { ContentState } from '@generated/prisma/enums'

import { buildViewableStateFilters } from './build-viewable-state-filters'

type Preview<OwnFilter extends Record<string, unknown>> = {
  stateRights: {
    state: ContentState
    rights: { hasOwn: boolean; hasAny: boolean }
  }[]
  ownFilter: OwnFilter
}

/**
 * Builds the Prisma `where` for content shown on the public web: published
 * content for everyone, plus unpublished states (drafts, archived) only as far
 * as the signed-in author may view them in administration.
 *
 * @param preview - The viewer's view rights per previewed state and "mine" predicate, or `null` for an anonymous visitor.
 * @returns A `{ OR: [...] }` clause to spread into a `where`.
 */
export const buildWebVisibleWhere = <OwnFilter extends Record<string, unknown>>(
  preview: Preview<OwnFilter> | null,
) => ({
  OR: [
    { state: 'published' as const },
    ...(preview === null
      ? []
      : buildViewableStateFilters(preview.stateRights, preview.ownFilter)),
  ],
})
