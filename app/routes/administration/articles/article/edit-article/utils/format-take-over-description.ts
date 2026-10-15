import type { EditHolder } from '~/utils/edit-hold/edit-hold-result'
import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'

/**
 * The takeover dialog's text (design 24g, copy 940ikr3o): who edits, since
 * when and when they last saved, so the Coordinator tells someone writing from
 * an editor left open; and that the last seconds of typing may be lost.
 *
 * @param holder - Who holds the article, since when and its last save.
 * @param now - The current time, which decides „dnes“.
 * @returns „Článek upravuje Jakub Novák od 14:02. Poslední uložení dnes v
 *   14:31. …“; an earlier day with its date, joined to the time by „v“ in
 *   both sentences (`od 14. 10. 2026 v 23:50`, `Poslední uložení 25. 9. 2026
 *   v 14:31`, copy hgb3jeqj).
 */
export const formatTakeOverDescription = (holder: EditHolder, now: Date) => {
  const today = formatNumericDate(now)
  const since = new Date(holder.since)
  const lastSavedAt = new Date(holder.lastSavedAt)

  const sinceText =
    formatNumericDate(since) === today
      ? formatTime(since)
      : `${formatNumericDate(since)} v ${formatTime(since)}`
  const lastSavedText =
    formatNumericDate(lastSavedAt) === today
      ? `dnes v ${formatTime(lastSavedAt)}`
      : `${formatNumericDate(lastSavedAt)} v ${formatTime(lastSavedAt)}`

  return `Článek upravuje ${holder.name} od ${sinceText}. Poslední uložení ${lastSavedText}. Po převzetí bude původní editor jen ke čtení. Neuložené změny se mohou ztratit.`
}
