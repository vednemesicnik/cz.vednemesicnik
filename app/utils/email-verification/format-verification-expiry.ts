import { formatDate } from '~/utils/format-date'
import { formatTime } from '~/utils/format-time'

// U+00A0, spelled out: in the source it would look like a plain space.
const NO_BREAK_SPACE = String.fromCodePoint(0xa0)

/**
 * Until when a code works, as the code form says it: `7. listopadu 2026 v
 * 18:42`, in Prague time (copy thread zup07jj5), with no break after the day
 * and after the `v` (design 15k).
 *
 * @param expiresAt - When the code stops working.
 * @returns The date and time.
 */
export const formatVerificationExpiry = (expiresAt: Date): string => {
  const day = formatDate(expiresAt).replace(/^(\d+\.) /, `$1${NO_BREAK_SPACE}`)

  return `${day} v${NO_BREAK_SPACE}${formatTime(expiresAt)}`
}
