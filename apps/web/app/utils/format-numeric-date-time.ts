import { formatNumericDate } from '~/utils/format-numeric-date'

/**
 * Formats a moment the way the administration lists it (`25. 9. 2026, 19:14`),
 * in the site's civil time (Europe/Prague). `cs-CZ` puts no comma between the
 * date and the time, so the two parts are joined here.
 *
 * @param date - The moment to format.
 * @returns The date as {@link formatNumericDate} gives it, a comma, and the time.
 */
export const formatNumericDateTime = (date: Date): string => {
  const time = date.toLocaleTimeString('cs-CZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })

  return `${formatNumericDate(date)}, ${time}`
}
