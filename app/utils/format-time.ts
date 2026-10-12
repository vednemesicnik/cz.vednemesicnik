/**
 * Formats the time of a moment the way the administration writes it within
 * the day (`14:35`, `8:03`), in the site's civil time (Europe/Prague).
 *
 * @param date - The moment to format.
 * @returns The hour and the minutes.
 */
export const formatTime = (date: Date): string =>
  date.toLocaleTimeString('cs-CZ', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/Prague',
  })
