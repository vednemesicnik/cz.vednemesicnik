import type { EditHoldState } from '~/hooks/use-edit-hold'

/**
 * The sentence under the editor's heading while it only reads (design 24h,
 * 24i; copy zqe81r3k, kjcijk1q): who edits it now; once nobody does, that the
 * text shown is old when the editor knows it changed, else only that it reads.
 * After a takeover the editor does not know whether the text changed.
 *
 * @param state - The editor's hold.
 * @returns „Jen ke čtení. Článek upravuje Marie Horáková.“, „Jen ke čtení.
 *   Zobrazený text není aktuální.“, „Jen ke čtení.“, or `null` while it
 *   holds, takes or asks.
 */
export const getReadOnlyNotice = (state: EditHoldState): string | null => {
  switch (state.status) {
    case 'held-by-other':
      return `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    case 'lost':
      return state.holder === null
        ? 'Jen ke čtení.'
        : `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    case 'changed':
      // No longer an editable draft (sent for review, published): its state
      // changed, not necessarily its text.
      if (!state.isEditable) return 'Jen ke čtení.'
      return state.holder === null
        ? 'Jen ke čtení. Zobrazený text není aktuální.'
        : `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    default:
      return null
  }
}
