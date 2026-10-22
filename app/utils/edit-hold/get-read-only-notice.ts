import type { EditHoldState } from '~/hooks/use-edit-hold'

import type { EditHoldContent } from './edit-hold-content'

// Who edits it and what the stale view shows, per content (copy ey73zhul for
// the issue).
const COPY: Record<
  EditHoldContent,
  { subject: string; stale: string; deleted: string }
> = {
  article: {
    deleted: 'Článek byl smazán.',
    stale: 'Zobrazený text není aktuální.',
    subject: 'Článek',
  },
  issue: {
    deleted: 'Číslo bylo smazáno.',
    stale: 'Zobrazené údaje nejsou aktuální.',
    subject: 'Číslo',
  },
}

/**
 * The sentence under the editor's heading while it only reads (design 24h,
 * 24i; copy zqe81r3k, kjcijk1q): who edits it now; once nobody does, that the
 * text shown is old when the editor knows it changed, else only that it reads.
 * After a takeover the editor does not know whether the text changed. Deleted,
 * it says so (24k, 26m).
 *
 * @param state - The editor's hold.
 * @param content - What the editor edits.
 * @returns „Jen ke čtení. Článek upravuje Marie Horáková.“, „Jen ke čtení.
 *   Zobrazený text není aktuální.“, „Jen ke čtení.“, or `null` while it
 *   holds, takes or asks.
 */
export const getReadOnlyNotice = (
  state: EditHoldState,
  content: EditHoldContent = 'article',
): string | null => {
  const { subject, stale, deleted } = COPY[content]

  switch (state.status) {
    case 'held-by-other':
      return `Jen ke čtení. ${subject} upravuje ${state.holder.name}.`
    case 'lost':
      return state.holder === null
        ? 'Jen ke čtení.'
        : `Jen ke čtení. ${subject} upravuje ${state.holder.name}.`
    case 'changed':
      // No longer an editable draft (sent for review, published): its state
      // changed, not necessarily its text.
      if (!state.isEditable) return 'Jen ke čtení.'
      return state.holder === null
        ? `Jen ke čtení. ${stale}`
        : `Jen ke čtení. ${subject} upravuje ${state.holder.name}.`
    // Gone for good (24k, 26m; copy rvp9ojsm).
    case 'deleted':
      return `Jen ke čtení. ${deleted}`
    default:
      return null
  }
}
