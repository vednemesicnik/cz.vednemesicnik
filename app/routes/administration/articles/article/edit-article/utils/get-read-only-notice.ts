import type { EditHoldState } from '~/hooks/use-edit-hold'

/**
 * The sentence under the editor's heading while it only reads (design 24h,
 * 24i; copy zqe81r3k): who edits it now, or, once nobody does, only that it
 * reads.
 *
 * @param state - The editor's hold.
 * @returns „Jen ke čtení. Článek upravuje Marie Horáková.“, „Jen ke čtení.“,
 *   or `null` while it holds, takes or asks.
 */
export const getReadOnlyNotice = (state: EditHoldState): string | null => {
  switch (state.status) {
    case 'held-by-other':
      return `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    case 'lost':
    case 'changed':
      return state.holder === null
        ? 'Jen ke čtení.'
        : `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    default:
      return null
  }
}
