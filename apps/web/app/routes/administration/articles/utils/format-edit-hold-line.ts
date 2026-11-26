import { formatNumericDate } from '~/utils/format-numeric-date'
import { formatTime } from '~/utils/format-time'

type Options = {
  holderName: string
  /** The signed-in author holds it, in another tab. */
  isOwn: boolean
  /** Since when, on the detail (23g); the list says only who (22f). */
  since?: Date
  now: Date
}

/**
 * The line that stands in for the fact under a held article's title while the
 * hold lasts (design 22f, 23g), plain like every fact.
 *
 * @returns `upravuje Tereza Malá`; with `since` `upravuje Jakub Novák od
 *   14:02`, past midnight `… od 27. 9. 2026, 14:02`. One's own hold is
 *   `upravujete vy` without a time, in the detail too: it stays true while the
 *   editor just closed in this very tab releases it (copy hgb3jeqj).
 */
export const formatEditHoldLine = ({
  holderName,
  isOwn,
  since,
  now,
}: Options): string => {
  if (isOwn) return 'upravujete vy'

  const who = `upravuje ${holderName}`

  if (since === undefined) return who

  return formatNumericDate(since) === formatNumericDate(now)
    ? `${who} od ${formatTime(since)}`
    : `${who} od ${formatNumericDate(since)}, ${formatTime(since)}`
}
