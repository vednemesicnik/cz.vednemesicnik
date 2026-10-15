import type { EditHoldState } from '~/hooks/use-edit-hold'

/**
 * The sentence under the editor's heading while it has no hold, until the
 * read-only editor of #671: who edits it now (24h), or that it changed
 * meanwhile (24i).
 *
 * @param state - The editor's hold.
 * @returns „Jen ke čtení. Článek upravuje Marie Horáková.“, „Článek se mezitím
 *   změnil.“, or `null` while it holds, takes or asks.
 */
export const getEditHoldNotice = (state: EditHoldState): string | null => {
  switch (state.status) {
    case 'lost':
      return `Jen ke čtení. Článek upravuje ${state.holderName}.`
    case 'held-by-other':
      return `Jen ke čtení. Článek upravuje ${state.holder.name}.`
    case 'changed':
      return 'Článek se mezitím změnil.'
    default:
      return null
  }
}
