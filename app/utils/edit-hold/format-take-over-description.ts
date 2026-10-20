import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'
import type { EditHolder } from '~/utils/edit-hold/edit-hold-result'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'

import type { EditHoldContent } from './edit-hold-content'

const SUBJECT: Record<EditHoldContent, string> = {
  article: 'Článek',
  issue: 'Číslo',
}

/**
 * The takeover dialog's text (design 24g, copy 940ikr3o): who edits, since
 * when and when they last saved, so the Coordinator tells someone writing from
 * an editor left open; and that the last seconds of typing may be lost.
 *
 * @param holder - Who holds the content, since when and its last save.
 * @param now - The current time, which decides „dnes“.
 * @param content - What the editor edits (copy ey73zhul for the issue).
 * @returns „Článek upravuje Jakub Novák od 14:02. Poslední uložení dnes v
 *   14:31. …“; an earlier day with its date, joined to the time by „v“ in
 *   both sentences (`od 14. 10. 2026 v 23:50`, `Poslední uložení 25. 9. 2026
 *   v 14:31`, copy hgb3jeqj).
 */
export const formatTakeOverDescription = (
  holder: EditHolder,
  now: Date,
  content: EditHoldContent = 'article',
) => {
  const today = formatNumericDate(now)
  const since = new Date(holder.since)
  const lastSavedAt = new Date(holder.lastSavedAt)

  const sinceText =
    formatNumericDate(since) === today
      ? formatTime(since)
      : `${formatNumericDate(since)} v ${formatTime(since)}`

  return `${SUBJECT[content]} upravuje ${holder.name} od ${sinceText}. Poslední uložení ${formatSavedMoment(lastSavedAt, now)}. Po převzetí bude původní editor jen ke čtení. Neuložené změny se mohou ztratit.`
}
