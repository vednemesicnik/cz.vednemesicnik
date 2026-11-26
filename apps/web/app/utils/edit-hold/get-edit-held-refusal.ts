import type { EditHeldRefusal } from './edit-held-refusal'
import type { EditHoldColumns } from './edit-hold-columns'
import { getEditHoldStatus } from './get-edit-hold-status'

type HeldContent = EditHoldColumns & {
  heldByAuthor: { name: string } | null
}

type Viewer = {
  authorId: string
  now: Date
  /** A delete waits for one's own other tab too (log 0036). */
  countsOwnOtherTab: boolean
}

/**
 * Whose hold stops the acting author's write (design 07g, log 0036):
 * someone else's always, one's own in another tab only for a delete.
 *
 * @param content - The hold columns and the holder's name.
 * @param viewer - The acting author, the moment, and whether one's own other
 *   tab counts.
 * @returns The refusal, or `null` when the hold does not stop the write.
 */
export const getEditHeldRefusal = (
  content: HeldContent,
  { authorId, now, countsOwnOtherTab }: Viewer,
): EditHeldRefusal | null => {
  const status = getEditHoldStatus(content, { authorId, now })
  const heldByName = content.heldByAuthor?.name

  if (heldByName === undefined) return null

  if (status === 'other') return { heldByName, isOwnOtherTab: false }

  if (status === 'own-other-tab' && countsOwnOtherTab) {
    return { heldByName, isOwnOtherTab: true }
  }

  return null
}
