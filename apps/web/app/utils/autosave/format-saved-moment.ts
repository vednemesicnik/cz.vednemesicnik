import { formatNumericDateOrToday } from '~/utils/format-numeric-date-or-today'
import { formatTime } from '~/utils/format-time'

/**
 * When the article last saved, as the editor's sentences say it (design 24e,
 * 24g–24i; copy hgb3jeqj).
 *
 * @param savedAt - The save.
 * @param now - The current time, which decides „dnes“.
 * @returns „dnes v 14:31“, another day „25. 9. 2026 v 14:31“.
 */
export const formatSavedMoment = (savedAt: Date, now: Date) =>
  `${formatNumericDateOrToday(savedAt, now)} v ${formatTime(savedAt)}`
