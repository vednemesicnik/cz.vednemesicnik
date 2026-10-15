import { buildFreeHoldWhere } from './build-free-hold-where'
import { buildHeldByTabWhere } from './build-held-by-tab-where'
import type { EditHoldTab } from './edit-hold-columns'

/** What a hold write repeats from the row it read. */
export type EditHoldCondition = {
  /** The stored `updatedAt`: a write that moves only the hold keeps it. */
  updatedAt: Date
  now: Date
  /** `free` to take, a tab to renew or release, `any` to take over. */
  holder: 'free' | 'any' | EditHoldTab
}

/**
 * The `where` of a hold write: a draft (published and archived content is never
 * held, design 07g), unchanged since it was read, held as expected.
 *
 * @param condition - The stored `updatedAt`, the moment and the expected holder.
 * @returns A `where` fragment for any content model with the hold columns.
 */
export const buildHoldConditionWhere = ({
  updatedAt,
  now,
  holder,
}: EditHoldCondition) => ({
  AND: [
    { state: 'draft' as const, updatedAt },
    holder === 'free'
      ? buildFreeHoldWhere(now)
      : holder === 'any'
        ? {}
        : buildHeldByTabWhere(holder),
  ],
})
